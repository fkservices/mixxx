// Autonomously AI-generated SPSC capture implementation.
#include "controllers/midi/rawmidicapture.h"

#include <algorithm>
#include <limits>
#include <QUuid>

namespace mixxx {
namespace {
std::atomic<uint32_t> s_liveBuffers{0};
}
std::shared_ptr<RawMidiCaptureBuffer> RawMidiCaptureBuffer::create(const QString& endpointId) {
    if (endpointId.isEmpty()) {
        return {};
    }
    if (s_liveBuffers.fetch_add(1) >= kEndpointLimit) {
        s_liveBuffers.fetch_sub(1);
        return {};
    }
    // A constructor allocation failure releases the budget reservation.
    RawMidiCaptureBuffer* buffer;
    try {
        buffer = new RawMidiCaptureBuffer(endpointId);
    } catch (...) {
        s_liveBuffers.fetch_sub(1);
        throw;
    }
    return std::shared_ptr<RawMidiCaptureBuffer>(buffer);
}
RawMidiCaptureBuffer::RawMidiCaptureBuffer(const QString& endpointId)
        : m_endpointId(endpointId),
          m_streamId(QUuid::createUuid().toString(QUuid::WithoutBraces)) {
}
RawMidiCaptureBuffer::~RawMidiCaptureBuffer() {
    s_liveBuffers.fetch_sub(1);
}
void RawMidiCaptureBuffer::publish() noexcept {
    // Sequential consistency makes the bounded atomic snapshot proof explicit:
    // every accepted even version surrounds exactly these published counters.
    m_version.fetch_add(1);
    m_publishedOffered.store(m_offered);
    m_publishedWritten.store(m_written);
    m_publishedDropped.store(m_dropped);
    m_publishedReadErrors.store(m_readErrors);
    m_publishedClosed.store(m_closed ? 1 : 0);
    m_version.fetch_add(1);
}
void RawMidiCaptureBuffer::offer(uint32_t word, int32_t timestamp,
        double capturedAtMs, uint32_t filterMask, int32_t readError, bool filterError) noexcept {
    if (m_closed) {
        return;
    }
    // Retire before either producer sequence or publication generation can wrap.
    if (m_offered >= (std::numeric_limits<uint64_t>::max() / 2) - 2) {
        finish();
        return;
    }
    ++m_offered;
    if (readError < 0 && !filterError) {
        ++m_readErrors;
    }
    const uint64_t tail = m_tail.load(std::memory_order_acquire);
    if (m_written - tail == kCapacity) {
        ++m_dropped;
    } else {
        m_packets[m_written % kCapacity] = {m_offered, capturedAtMs, word,
                timestamp, filterMask, readError, readError < 0 ? (filterError ? 2u : 1u) : 0u};
        ++m_written;
        m_head.store(m_written, std::memory_order_release);
    }
    // Never publish an offered watermark before the corresponding slot/head.
    publish();
}
void RawMidiCaptureBuffer::finish() noexcept {
    if (!m_closed) {
        m_closed = true;
        publish();
    }
}
std::optional<RawMidiCaptureBuffer::Status> RawMidiCaptureBuffer::status() const noexcept {
    for (int attempt = 0; attempt < 2; ++attempt) {
        const auto before = m_version.load();
        if (before & 1) {
            continue;
        }
        Status result{m_publishedOffered.load(), m_publishedWritten.load(),
                m_publishedDropped.load(), m_publishedReadErrors.load(),
                m_publishedClosed.load() != 0};
        if (m_version.load() == before) {
            return result;
        }
    }
    return std::nullopt;
}
size_t RawMidiCaptureBuffer::drainThrough(const Status& snapshot,
        std::array<RawMidiCapturePacket, kDrainLimit>* output) noexcept {
    if (!output) {
        return 0;
    }
    auto tail = m_tail.load(std::memory_order_relaxed);
    const auto limit = std::min(snapshot.written, m_head.load(std::memory_order_acquire));
    size_t count = 0;
    while (tail < limit && count < kDrainLimit) {
        (*output)[count++] = m_packets[tail++ % kCapacity];
    }
    m_tail.store(tail, std::memory_order_release);
    return count;
}
} // namespace mixxx
// End of autonomously AI-generated SPSC capture implementation.
