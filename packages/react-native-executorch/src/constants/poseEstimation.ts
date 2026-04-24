/**
 * Standard COCO keypoint enum (17 keypoints).
 * Use for type-safe keypoint access: `keypoints[CocoKeypoint.NOSE]`
 * @category Models - Pose Estimation
 */
export const CocoKeypoint = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

/**
 * COCO skeleton connections for drawing pose lines
 * Each pair is [startKeypointIndex, endKeypointIndex]
 * @category Models - Pose Estimation
 */
export const COCO_SKELETON_CONNECTIONS = [
  // Head
  [0, 1], // nose -> left_eye
  [0, 2], // nose -> right_eye
  [1, 3], // left_eye -> left_ear
  [2, 4], // right_eye -> right_ear
  // Arms
  [5, 6], // left_shoulder -> right_shoulder
  [5, 7], // left_shoulder -> left_elbow
  [7, 9], // left_elbow -> left_wrist
  [6, 8], // right_shoulder -> right_elbow
  [8, 10], // right_elbow -> right_wrist
  // Torso
  [5, 11], // left_shoulder -> left_hip
  [6, 12], // right_shoulder -> right_hip
  [11, 12], // left_hip -> right_hip
  // Legs
  [11, 13], // left_hip -> left_knee
  [13, 15], // left_knee -> left_ankle
  [12, 14], // right_hip -> right_knee
  [14, 16], // right_knee -> right_ankle
] as const;
