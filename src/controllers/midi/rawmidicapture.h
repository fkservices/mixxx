// Autonomously AI-generated bounded native MIDI observer; no mapping or dispatch.
#pragma once

#include <array>
#include <atomic>
#include <cstdint>
#include <memory>
#include <optional>
#include <QString>

namespace mixxx {

struct RawMidiCapturePacket {
    uint64_t sequence;
    double capturedAtMs;
    uint32_t packedWord;
    int32_t backendTimestamp;
    uint32_t effectiveFilterMask;
    // Zero denotes a packet; a negative PortMidi read error denotes unknown loss.
    int32_t readError;
    // 0 packet, 1 backend read loss, 2 filter restoration failure.
    uint32_t errorSource;
};
static_assert(sizeof(RawMidiCapturePacket) <= 64);
static_assert(std::atomic<uint64_t>::is_always_lock_free);

class RawMidiCaptureBuffer final {
  public:
    static constexpr size_t kCapacity = 4096;
    static constexpr size_t kDrainLimit = 64;
    static constexpr uint32_t kEndpointLimit = 32;
    struct Status {
        uint64_t offered;
        uint64_t written;
        uint64_t dropped;
        uint64_t readErrors;
        bool closed;
    };
    // Cold path only. Live and retained retired buffers share the memory budget.
    static std::shared_ptr<RawMidiCaptureBuffer> create(const QString& endpointId);
    ~RawMidiCaptureBuffer();
    const QString& endpointId() const { return m_endpointId; }
    const QString& streamId() const { return m_streamId; }

    // Exactly one producer. No allocation, waiting, signals, serialization or I/O.
    void offer(uint32_t word, int32_t timestamp, double capturedAtMs,
            uint32_t filterMask, int32_t readError = 0, bool filterError = false) noexcept;
    void finish() noexcept;
    // Exactly one consumer. Snapshot acquisition tries at most twice.
    std::optional<Status> status() const noexcept;
    size_t drainThrough(const Status& status,
            std::array<RawMidiCapturePacket, kDrainLimit>* output) noexcept;

  private:
    explicit RawMidiCaptureBuffer(const QString& endpointId);
    void publish() noexcept;
    const QString m_endpointId;
    const QString m_streamId;
    std::array<RawMidiCapturePacket, kCapacity> m_packets{};
    uint64_t m_offered = 0;
    uint64_t m_written = 0;
    uint64_t m_dropped = 0;
    uint64_t m_readErrors = 0;
    bool m_closed = false;
    std::atomic<uint64_t> m_head{0};
    std::atomic<uint64_t> m_tail{0};
    // Atomic fields avoid the C++ data race of a conventional non-atomic seqlock.
    std::atomic<uint64_t> m_version{0};
    std::atomic<uint64_t> m_publishedOffered{0};
    std::atomic<uint64_t> m_publishedWritten{0};
    std::atomic<uint64_t> m_publishedDropped{0};
    std::atomic<uint64_t> m_publishedReadErrors{0};
    std::atomic<uint64_t> m_publishedClosed{0};
};
} // namespace mixxx
// End of autonomously AI-generated native MIDI observer.
