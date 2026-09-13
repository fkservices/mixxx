// Autonomously AI-generated native clock bridge for the AI DJ integration.
#pragma once

#include <chrono>

namespace mixxx {

/// Read-only time for script deadlines, in milliseconds with fractional precision.
/// The origin is the first call in this process, shared across mapping reloads.
/// Values are not comparable with wall time, another process, or Node's clock.
/// Suspend accounting is platform-specific; resume must invalidate live sessions.
class ControllerMonotonicClock final {
  public:
    static double nowMilliseconds() {
        using Clock = std::chrono::steady_clock;
        static_assert(Clock::is_steady);
        static const auto origin = Clock::now();
        return std::chrono::duration<double, std::milli>(Clock::now() - origin).count();
    }
};

} // namespace mixxx
// End of autonomously AI-generated native clock bridge.
