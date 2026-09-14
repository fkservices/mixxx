#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include <QScopedPointer>
#include <thread>

#include "controllers/midi/portmidicontroller.h"
#include "controllers/midi/portmididevice.h"
#include "test/mixxxtest.h"

using ::testing::_;
using ::testing::DoAll;
using ::testing::NotNull;
using ::testing::Return;
using ::testing::Sequence;
using ::testing::SetArrayArgument;

class MockPortMidiController : public PortMidiController {
  public:
    MockPortMidiController(const PmDeviceInfo* inputDeviceInfo,
            const PmDeviceInfo* outputDeviceInfo,
            int inputDeviceIndex,
            int outputDeviceIndex)
            : PortMidiController(inputDeviceInfo,
                      outputDeviceInfo,
                      inputDeviceIndex,
                      outputDeviceIndex) {
    }
    ~MockPortMidiController() override {
    }

    void sendShortMsg(unsigned char status, unsigned char byte1, unsigned char byte2) override {
        PortMidiController::sendShortMsg(status, byte1, byte2);
    }

    void sendSysexMsg(const QList<int>& data, unsigned int length) {
        PortMidiController::sendSysexMsg(data, length);
    }

    MOCK_METHOD4(receivedShortMessage,
            void(unsigned char, unsigned char, unsigned char, mixxx::Duration));
    MOCK_METHOD2(receive, void(const QByteArray&, mixxx::Duration));

    MOCK_METHOD(void, notifyInputLoss, (const QString&), (override));

    // These tests are unrelated to scripting.
    MOCK_METHOD0(startEngine, void());
    MOCK_METHOD0(stopEngine, void());
};

class MockPortMidiDevice : public PortMidiDevice {
  public:
    MockPortMidiDevice(PmDeviceInfo* info, int index)
            : PortMidiDevice(info, index) {
    }

    MOCK_CONST_METHOD0(isOpen, bool());
    MOCK_METHOD1(openInput, PmError(int32_t));
    MOCK_METHOD0(openOutput, PmError());
    MOCK_METHOD0(close, PmError());
    MOCK_METHOD0(poll, PmError());
    MOCK_METHOD(PmError, setFilter, (int32_t), (override));
    MOCK_METHOD2(read, int(PmEvent*, int32_t));
    MOCK_METHOD1(writeShort, PmError(int32_t));
    MOCK_METHOD1(writeSysEx, PmError(unsigned char*));
};

class PortMidiControllerTest : public MixxxTest {
  protected:
    PortMidiControllerTest()
            : m_mockInput(new MockPortMidiDevice(&m_inputDeviceInfo, 0)),
              m_mockOutput(new MockPortMidiDevice(&m_outputDeviceInfo, 0)) {
        // PmDeviceInfo::name is non const since portmidi 2.0.1
        // We maintain the memory here in place of Pm_GetDeviceInfo()
        char inputDeviceName[] = "Test Input Device";
        char outputDeviceName[] = "Test Output Device";
        constexpr const char interf[] = "Test";
        m_inputDeviceInfo.name = inputDeviceName;
        m_inputDeviceInfo.interf = interf;
        m_inputDeviceInfo.input = 1;
        m_inputDeviceInfo.output = 0;
        m_inputDeviceInfo.opened = 0;

        m_outputDeviceInfo.name = outputDeviceName;
        m_outputDeviceInfo.interf = interf;
        m_outputDeviceInfo.input = 0;
        m_outputDeviceInfo.output = 1;
        m_outputDeviceInfo.opened = 0;

        m_pController.reset(new MockPortMidiController(
                &m_inputDeviceInfo, &m_outputDeviceInfo, 0, 0));
        m_pController->setPortMidiInputDevice(m_mockInput);
        m_pController->setPortMidiOutputDevice(m_mockOutput);
    }

    void openDevice() {
        m_pController->open({});
    }

    void closeDevice() {
        m_pController->close();
    }

    void pollDevice() {
        m_pController->poll();
    }

    // Autonomously AI-generated fixture setup for capture-only native tests.
    std::shared_ptr<mixxx::RawMidiCaptureBuffer> beginCapture() {
        ON_CALL(*m_mockInput, isOpen()).WillByDefault(Return(true));
        ON_CALL(*m_mockOutput, isOpen()).WillByDefault(Return(true));
        ON_CALL(*m_mockInput, openInput(_)).WillByDefault(Return(pmNoError));
        ON_CALL(*m_mockOutput, openOutput()).WillByDefault(Return(pmNoError));
        ON_CALL(*m_mockInput, close()).WillByDefault(Return(pmNoError));
        ON_CALL(*m_mockOutput, close()).WillByDefault(Return(pmNoError));
        EXPECT_CALL(*m_mockInput, setFilter(_)).WillRepeatedly(Return(pmNoError));
        openDevice();
        return m_pController->startRawMidiCapture();
    }
    // End of autonomously AI-generated fixture setup.

    PmDeviceInfo m_inputDeviceInfo;
    PmDeviceInfo m_outputDeviceInfo;
    MockPortMidiDevice* m_mockInput;
    MockPortMidiDevice* m_mockOutput;
    QScopedPointer<MockPortMidiController> m_pController;
};

PmEvent MakeEvent(PmMessage message, PmTimestamp timestamp) {
    PmEvent event;
    event.message = message;
    event.timestamp = timestamp;
    return event;
}

MATCHER_P(ByteArrayEquals, value,
          "Checks that the non-NULL terminated argument array exactly equals "
          "the provided byte container.") {
    for (int i = 0; i < value.size(); ++i) {
        if (arg[i] != value.at(i))
            return false;
    }
    return true;
}

TEST_F(PortMidiControllerTest, OpenClose) {
    Sequence input;
    ON_CALL(*m_mockInput, isOpen())
            .WillByDefault(Return(false));
    EXPECT_CALL(*m_mockInput, openInput(MIXXX_PORTMIDI_BUFFER_LEN))
            .InSequence(input)
            .WillOnce(Return(pmNoError));
    EXPECT_CALL(*m_mockInput, isOpen())
            .InSequence(input)
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, close())
            .InSequence(input)
            .WillOnce(Return(pmNoError));

    Sequence output;
    ON_CALL(*m_mockOutput, isOpen())
            .WillByDefault(Return(false));
    EXPECT_CALL(*m_mockOutput, openOutput())
            .WillOnce(Return(pmNoError));
    EXPECT_CALL(*m_mockOutput, isOpen())
            .InSequence(output)
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockOutput, close())
            .InSequence(output)
            .WillOnce(Return(pmNoError));

    openDevice();
    EXPECT_TRUE(m_pController->isOpen());
    closeDevice();
    EXPECT_FALSE(m_pController->isOpen());
};

TEST_F(PortMidiControllerTest, WriteShort) {
    // Note that Pm_WriteShort takes an int32_t formatted as 0x00B2B1SS where SS
    // is the status byte, B1 is the first message byte and B2 is the second
    // message byte.
    Sequence output;
    EXPECT_CALL(*m_mockOutput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockOutput, writeShort(0x403C90))
            .InSequence(output)
            .WillOnce(Return(pmNoError));
    EXPECT_CALL(*m_mockOutput, writeShort(0xFFFFFF))
            .InSequence(output)
            .WillOnce(Return(pmBadData));
    EXPECT_CALL(*m_mockOutput, writeShort(0x403C80))
            .InSequence(output)
            .WillOnce(Return(pmNoError));

    m_pController->sendShortMsg(0x90, 0x3C, 0x40);
    m_pController->sendShortMsg(0xFF, 0xFF, 0xFF);
    m_pController->sendShortMsg(0x80, 0x3C, 0x40);
};

TEST_F(PortMidiControllerTest, WriteSysex) {
    QList<int> sysex;
    sysex.append(0xF0);
    sysex.append(0x12);
    sysex.append(0xF7);

    EXPECT_CALL(*m_mockOutput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockOutput, writeSysEx(ByteArrayEquals(sysex)))
            .WillOnce(Return(pmNoError));
    m_pController->sendSysexMsg(sysex, sysex.length());
};

TEST_F(PortMidiControllerTest, WriteSysex_Malformed) {
    QList<int> sysex;
    sysex.append(0xF0);
    sysex.append(0x12);

    EXPECT_CALL(*m_mockOutput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockOutput, writeSysEx(_))
            .Times(0);
    m_pController->sendSysexMsg(sysex, sysex.length());
};


TEST_F(PortMidiControllerTest, Poll_Read_Basic) {
    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x403C90, 0x0));
    messages.push_back(MakeEvent(0x403C80, 0x1));

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                    Return(static_cast<int>(messages.size()))));

    EXPECT_CALL(*m_pController, receivedShortMessage(0x90, 0x3C, 0x40, _))
            .InSequence(read);
    EXPECT_CALL(*m_pController, receivedShortMessage(0x80, 0x3C, 0x40, _))
            .InSequence(read);

    pollDevice();
};

TEST_F(PortMidiControllerTest, Poll_Read_SysExWithRealtime) {
    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x332211F0, 0x0));
    messages.push_back(MakeEvent(0x000000F8, 0x1));
    messages.push_back(MakeEvent(0x77665544, 0x0));
    messages.push_back(MakeEvent(0x000000FA, 0x2));
    messages.push_back(MakeEvent(0x000000F7, 0x0));

    QByteArray sysex;
    sysex.append('\xF0');
    sysex.append('\x11');
    sysex.append('\x22');
    sysex.append('\x33');
    sysex.append('\x44');
    sysex.append('\x55');
    sysex.append('\x66');
    sysex.append('\x77');
    sysex.append('\xF7');

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                            Return(messages.size())));
    EXPECT_CALL(*m_pController, receivedShortMessage(0xF8, 0x00, 0x00, _))
            .InSequence(read);
    EXPECT_CALL(*m_pController, receivedShortMessage(0xFA, 0x00, 0x00, _))
            .InSequence(read);
    EXPECT_CALL(*m_pController, receive(sysex, _))
            .InSequence(read);

    pollDevice();
};

TEST_F(PortMidiControllerTest, Poll_Read_SysEx) {
    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x332211F0, 0x0));
    messages.push_back(MakeEvent(0xF7665544, 0x1));

    QByteArray sysex;
    sysex.append('\xF0');
    sysex.append('\x11');
    sysex.append('\x22');
    sysex.append('\x33');
    sysex.append('\x44');
    sysex.append('\x55');
    sysex.append('\x66');
    sysex.append('\xF7');

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                            Return(messages.size())));
    EXPECT_CALL(*m_pController, receive(sysex, _))
            .InSequence(read);

    pollDevice();
};

TEST_F(PortMidiControllerTest,
       Poll_Read_SysExWithRealtime_CoincidentalRealtimeByte) {
    // We used to incorrectly treat an 0xF8 occurring in a SysEx message as a
    // realtime message. This test verifies that we do not do this anymore.
    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x332211F0, 0x0));
    messages.push_back(MakeEvent(0x6655F844, 0x0));
    messages.push_back(MakeEvent(0x0000F777, 0x0));

    QByteArray sysex;
    sysex.append('\xF0');
    sysex.append('\x11');
    sysex.append('\x22');
    sysex.append('\x33');
    sysex.append('\x44');
    sysex.append('\xF8');
    sysex.append('\x55');
    sysex.append('\x66');
    sysex.append('\x77');
    sysex.append('\xF7');

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                            Return(messages.size())));
    EXPECT_CALL(*m_pController, receive(sysex, _))
            .InSequence(read);

    pollDevice();
};

TEST_F(PortMidiControllerTest, Poll_Read_SysExInterrupted_FollowedByNormalMessage) {
    // According to the PortMIDI documentation when a SysEx message is
    // interrupted, we will expect to see a non-realtime status byte as a new
    // message before seeing an EOX terminating SysEx. In this event we drop the
    // SysEx message and process the new message as normal.

    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x332211F0, 0x0));
    messages.push_back(MakeEvent(0x00403C90, 0x0));

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                            Return(messages.size())));
    EXPECT_CALL(*m_pController, receivedShortMessage(0x90, 0x3C, 0x40, _))
            .InSequence(read);

    pollDevice();
};

TEST_F(PortMidiControllerTest, Poll_Read_SysExInterrupted_FollowedBySysExMessage) {
    // According to the PortMIDI documentation when a SysEx message is
    // interrupted, we will expect to see a non-realtime status byte as a new
    // message before seeing an EOX terminating SysEx. In this event we drop the
    // SysEx message and process the new message as normal.

    std::vector<PmEvent> messages;
    messages.push_back(MakeEvent(0x332211F0, 0x0));
    messages.push_back(MakeEvent(0x77665544, 0x0));
    messages.push_back(MakeEvent(0x332211F0, 0x1));
    messages.push_back(MakeEvent(0xF7665544, 0x0));

    QByteArray sysex;
    sysex.append('\xF0');
    sysex.append('\x11');
    sysex.append('\x22');
    sysex.append('\x33');
    sysex.append('\x44');
    sysex.append('\x55');
    sysex.append('\x66');
    sysex.append('\xF7');

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages.begin(), messages.end()),
                            Return(messages.size())));
    EXPECT_CALL(*m_pController, receive(sysex, _))
            .InSequence(read);

    pollDevice();
};


TEST_F(PortMidiControllerTest, Poll_Read_SysEx_BufferOverflow) {
    // According to the PortMIDI documentation when a SysEx message is
    // interrupted, we will expect to see a non-realtime status byte as a new
    // message before seeing an EOX terminating SysEx. In this event we drop the
    // SysEx message and process the new message as normal.

    std::vector<PmEvent> messages1;
    messages1.push_back(MakeEvent(0x332211F0, 0x0));
    messages1.push_back(MakeEvent(0x77665544, 0x0));

    std::vector<PmEvent> messages2;
    messages2.push_back(MakeEvent(0x332211F0, 0x1));

    std::vector<PmEvent> messages3;
    messages3.push_back(MakeEvent(0xF7665544, 0x2));

    QByteArray sysex;
    sysex.append('\xF0');
    sysex.append('\x11');
    sysex.append('\x22');
    sysex.append('\x33');
    sysex.append('\x44');
    sysex.append('\x55');
    sysex.append('\x66');
    sysex.append('\xF7');

    Sequence read;
    EXPECT_CALL(*m_mockInput, isOpen())
            .WillRepeatedly(Return(true));

    // Poll 1 -- returns messages1.
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages1.begin(), messages1.end()),
                            Return(messages1.size())));

    // Poll 2 -- buffer overflow.
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(Return(pmBufferOverflow));

    // Poll 3 -- returns messages2.
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages2.begin(), messages2.end()),
                            Return(messages2.size())));

    // Poll 4 -- returns messages3.
    EXPECT_CALL(*m_mockInput, read(NotNull(), _))
            .InSequence(read)
            .WillOnce(DoAll(SetArrayArgument<0>(messages3.begin(), messages3.end()),
                            Return(messages3.size())));
    EXPECT_CALL(*m_pController, receive(sysex, _))
            .InSequence(read);

    pollDevice();
    pollDevice();
    pollDevice();
    pollDevice();
};

// Autonomously AI-generated overflow recovery regression.
TEST_F(PortMidiControllerTest, OverflowDiscardsPartialSysexAndNotifiesBeforeNewInput) {
    const std::vector<PmEvent> partial{MakeEvent(0x332211F0, 0)};
    const std::vector<PmEvent> fresh{MakeEvent(0xF75544F0, 1)};
    Sequence order;
    EXPECT_CALL(*m_mockInput, isOpen()).WillRepeatedly(Return(true));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _)).InSequence(order)
            .WillOnce(DoAll(SetArrayArgument<0>(partial.begin(), partial.end()), Return(1)));
    EXPECT_CALL(*m_mockInput, read(NotNull(), _)).InSequence(order)
            .WillOnce(Return(pmBufferOverflow));
    EXPECT_CALL(*m_pController, notifyInputLoss(QStringLiteral("portmidi-overflow")))
            .InSequence(order);
    EXPECT_CALL(*m_mockInput, read(NotNull(), _)).InSequence(order)
            .WillOnce(DoAll(SetArrayArgument<0>(fresh.begin(), fresh.end()), Return(1)));
    EXPECT_CALL(*m_pController, receive(QByteArray::fromHex("f04455f7"), _))
            .InSequence(order);
    pollDevice();
    pollDevice();
    pollDevice();
}
// End of autonomously AI-generated overflow regression.

// Autonomously AI-generated native capture regression tests.
TEST_F(PortMidiControllerTest, CaptureBeforeParserPreservesLegacyDispatch) {
    auto capture = beginCapture();
    ASSERT_TRUE(capture);
    PmEvent input[] = {{0x004007b0, 1}, {0x004007b0, 2}, {0xfe, 3}, {0xf8, 4},
            {0x030201f0, 5}, {0x004008b0, 6}};
    EXPECT_CALL(*m_mockInput, read(_, _)).WillOnce(DoAll(SetArrayArgument<0>(input, input + 6), Return(6)));
    EXPECT_CALL(*m_pController, receivedShortMessage(0xb0, 7, 64, _)).Times(2);
    EXPECT_CALL(*m_pController, receivedShortMessage(0xf8, 0, 0, _)).Times(1);
    EXPECT_CALL(*m_pController, receivedShortMessage(0xfe, _, _, _)).Times(0);
    EXPECT_CALL(*m_pController, receivedShortMessage(0xb0, 8, 64, _)).Times(1);
    pollDevice();
    auto state = capture->status();
    ASSERT_TRUE(state);
    EXPECT_EQ(state->offered, 6u);
    std::array<mixxx::RawMidiCapturePacket, 64> output;
    ASSERT_EQ(capture->drainThrough(*state, &output), 6u);
    for (size_t i = 0; i < 6; ++i) {
        EXPECT_EQ(output[i].sequence, i + 1);
        EXPECT_EQ(output[i].packedWord, input[i].message);
        EXPECT_EQ(output[i].backendTimestamp, input[i].timestamp);
        EXPECT_EQ(output[i].effectiveFilterMask, 0u);
        EXPECT_EQ(output[i].errorSource, 0u);
    }
    EXPECT_CALL(*m_mockInput, setFilter(PM_FILT_ACTIVE)).WillOnce(Return(pmNoError));
    EXPECT_TRUE(m_pController->stopRawMidiCapture());
    EXPECT_TRUE(capture->status()->closed);
}
TEST_F(PortMidiControllerTest, CaptureRetainsLongSysexBeforeLegacyTruncation) {
    auto capture = beginCapture();
    ASSERT_TRUE(capture);
    std::array<PmEvent, 301> input;
    input.fill(PmEvent{0x01010101, -2147483647});
    input.front().message = 0x010101f0;
    input.back().message = 0xf7;
    EXPECT_CALL(*m_mockInput, read(_, _)).WillOnce(DoAll(SetArrayArgument<0>(input.begin(), input.end()), Return(input.size())));
    EXPECT_CALL(*m_pController, receive(_, _)).WillOnce([](const QByteArray& bytes, mixxx::Duration) {
        EXPECT_EQ(bytes.size(), MIXXX_SYSEX_BUFFER_LEN);
    });
    pollDevice();
    const auto state = capture->status();
    ASSERT_TRUE(state);
    EXPECT_EQ(state->offered, input.size());
    std::array<mixxx::RawMidiCapturePacket, 64> output;
    size_t consumed = 0;
    while (auto count = capture->drainThrough(*state, &output)) {
        for (size_t i = 0; i < count; ++i) {
            EXPECT_EQ(output[i].packedWord, input[consumed].message);
            EXPECT_EQ(output[i].backendTimestamp, input[consumed].timestamp);
            ++consumed;
        }
    }
    EXPECT_EQ(consumed, input.size());
}
TEST_F(PortMidiControllerTest, CaptureReadLossAndFilterFailureAreDifferentEvidence) {
    auto capture = beginCapture();
    ASSERT_TRUE(capture);
    EXPECT_CALL(*m_mockInput, read(_, _)).WillOnce(Return(pmBufferOverflow));
    EXPECT_CALL(*m_pController, notifyInputLoss(QStringLiteral("portmidi-overflow")));
    pollDevice();
    EXPECT_CALL(*m_mockInput, setFilter(PM_FILT_ACTIVE)).WillOnce(Return(pmHostError));
    EXPECT_FALSE(m_pController->stopRawMidiCapture());
    auto state = capture->status();
    ASSERT_TRUE(state);
    EXPECT_EQ(state->readErrors, 1u);
    EXPECT_FALSE(state->closed);
    std::array<mixxx::RawMidiCapturePacket, 64> output;
    ASSERT_EQ(capture->drainThrough(*state, &output), 2u);
    EXPECT_EQ(output[0].errorSource, 1u);
    EXPECT_EQ(output[0].readError, pmBufferOverflow);
    EXPECT_EQ(output[1].errorSource, 2u);
    EXPECT_EQ(output[1].readError, pmHostError);
    EXPECT_CALL(*m_mockInput, setFilter(PM_FILT_ACTIVE)).WillOnce(Return(pmNoError));
    EXPECT_TRUE(m_pController->stopRawMidiCapture());
}
TEST_F(PortMidiControllerTest, CaptureActivationFailureAndReopenIdentity) {
    auto first = beginCapture();
    ASSERT_TRUE(first);
    closeDevice();
    EXPECT_TRUE(first->status()->closed);
    openDevice();
    EXPECT_CALL(*m_mockInput, setFilter(0)).WillOnce(Return(pmHostError));
    EXPECT_FALSE(m_pController->startRawMidiCapture());
    EXPECT_CALL(*m_mockInput, setFilter(0)).WillOnce(Return(pmNoError));
    auto next = m_pController->startRawMidiCapture();
    ASSERT_TRUE(next);
    EXPECT_NE(first->endpointId(), next->endpointId());
    EXPECT_NE(first->streamId(), next->streamId());
    EXPECT_EQ(next->status()->offered, 0u);
}
TEST(RawMidiCaptureBufferTest, BoundedOverflowWrapAndFinalWatermark) {
    auto buffer = mixxx::RawMidiCaptureBuffer::create(QStringLiteral("endpoint"));
    ASSERT_TRUE(buffer);
    for (uint64_t i = 0; i < 5000; ++i) buffer->offer(i, 0, 0, 0);
    auto state = buffer->status();
    ASSERT_TRUE(state);
    EXPECT_EQ(state->offered, 5000u);
    EXPECT_EQ(state->written, 4096u);
    EXPECT_EQ(state->dropped, 904u);
    std::array<mixxx::RawMidiCapturePacket, 64> output;
    uint64_t drained = 0;
    while (auto count = buffer->drainThrough(*state, &output)) {
        for (size_t i = 0; i < count; ++i) EXPECT_EQ(output[i].sequence, ++drained);
    }
    EXPECT_EQ(drained, 4096u);
    buffer->offer(99, -1, 1, 0);
    buffer->finish();
    state = buffer->status();
    ASSERT_TRUE(state);
    ASSERT_EQ(buffer->drainThrough(*state, &output), 1u);
    EXPECT_EQ(output[0].sequence, 5001u);
    EXPECT_EQ(output[0].packedWord, 99u);
    EXPECT_TRUE(state->closed);
    buffer->offer(100, 0, 0, 0);
    EXPECT_EQ(buffer->status()->offered, 5001u);
}
TEST(RawMidiCaptureBufferTest, ConcurrentSnapshotsAndDrainsAccountForEveryOffer) {
    auto buffer = mixxx::RawMidiCaptureBuffer::create(QStringLiteral("concurrent"));
    ASSERT_TRUE(buffer);
    constexpr uint64_t total = 100000;
    std::thread producer([&] {
        for (uint64_t i = 1; i <= total; ++i) buffer->offer(i, -1, i, 0);
        buffer->finish();
    });
    uint64_t last = 0, received = 0;
    std::array<mixxx::RawMidiCapturePacket, 64> output;
    for (;;) {
        auto state = buffer->status();
        if (!state) continue;
        EXPECT_EQ(state->offered, state->written + state->dropped);
        auto count = buffer->drainThrough(*state, &output);
        for (size_t i = 0; i < count; ++i) {
            EXPECT_GT(output[i].sequence, last);
            EXPECT_LE(output[i].sequence, state->offered);
            EXPECT_EQ(output[i].packedWord, output[i].sequence);
            last = output[i].sequence;
            ++received;
        }
        if (state->closed && count == 0) {
            EXPECT_EQ(received, state->written);
            EXPECT_EQ(received + state->dropped, total);
            break;
        }
    }
    producer.join();
}
TEST(RawMidiCaptureBufferTest, RetainedBuffersRespectGlobalMemoryBudget) {
    std::array<std::shared_ptr<mixxx::RawMidiCaptureBuffer>, 32> buffers;
    for (auto& b : buffers) {
        b = mixxx::RawMidiCaptureBuffer::create(QStringLiteral("budget"));
        ASSERT_TRUE(b);
        b->finish();
    }
    EXPECT_FALSE(mixxx::RawMidiCaptureBuffer::create(QStringLiteral("overflow")));
    buffers[0].reset();
    EXPECT_TRUE(mixxx::RawMidiCaptureBuffer::create(QStringLiteral("available")));
}
TEST_F(PortMidiControllerTest, CaptureDisabledStillSuppressesPreviouslyQueuedActiveSensing) {
    auto capture = beginCapture();
    ASSERT_TRUE(capture);
    ASSERT_TRUE(m_pController->stopRawMidiCapture());
    PmEvent input[] = {{0xfe, 0}, {0x004007b0, 1}};
    EXPECT_CALL(*m_mockInput, read(_, _)).WillOnce(DoAll(SetArrayArgument<0>(input, input + 2), Return(2)));
    EXPECT_CALL(*m_pController, receivedShortMessage(0xfe, _, _, _)).Times(0);
    EXPECT_CALL(*m_pController, receivedShortMessage(0xb0, 7, 64, _)).Times(1);
    pollDevice();
    EXPECT_EQ(capture->status()->offered, 0u);
    EXPECT_TRUE(capture->status()->closed);
}
// End of autonomously AI-generated native capture tests.
