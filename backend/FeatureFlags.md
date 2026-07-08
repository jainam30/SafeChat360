# Feature Flags

## Overview
The `FeatureFlagService` allows graceful degradation, A/B testing, and canary rollouts of new features without requiring code deployments.

## Capabilities
1. **Global Toggle**: Turn a feature on or off entirely.
2. **User Targeting**: Enable a feature for specific User IDs (ideal for beta testers).
3. **Percentage Rollout**: Deterministically enable a feature for a percentage of users using a consistent MD5 hash of `flag_name:user_id`.

## Usage

```python
from app.deps import get_feature_flag_service

flags = get_feature_flag_service()

if flags.is_enabled("voice_calls", user_id=current_user.id):
    # Execute voice call logic
    pass
else:
    raise APIException(403, "Feature not available")
```
