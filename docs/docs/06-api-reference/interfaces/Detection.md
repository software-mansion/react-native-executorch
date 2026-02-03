# Interface: Detection

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:28](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/objectDetection.ts#L28)

Represents a detected object within an image, including its bounding box, label, and confidence score.

## Properties

### bbox

> **bbox**: [`Bbox`](Bbox.md)

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:29](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/objectDetection.ts#L29)

The bounding box of the detected object, defined by its top-left (x1, y1) and bottom-right (x2, y2) coordinates.

---

### label

> **label**: `"PERSON"` \| `"BICYCLE"` \| `"CAR"` \| `"MOTORCYCLE"` \| `"AIRPLANE"` \| `"BUS"` \| `"TRAIN"` \| `"TRUCK"` \| `"BOAT"` \| `"TRAFFIC_LIGHT"` \| `"FIRE_HYDRANT"` \| `"STREET_SIGN"` \| `"STOP_SIGN"` \| `"PARKING"` \| `"BENCH"` \| `"BIRD"` \| `"CAT"` \| `"DOG"` \| `"HORSE"` \| `"SHEEP"` \| `"COW"` \| `"ELEPHANT"` \| `"BEAR"` \| `"ZEBRA"` \| `"GIRAFFE"` \| `"HAT"` \| `"BACKPACK"` \| `"UMBRELLA"` \| `"SHOE"` \| `"EYE"` \| `"HANDBAG"` \| `"TIE"` \| `"SUITCASE"` \| `"FRISBEE"` \| `"SKIS"` \| `"SNOWBOARD"` \| `"SPORTS"` \| `"KITE"` \| `"BASEBALL"` \| `"SKATEBOARD"` \| `"SURFBOARD"` \| `"TENNIS_RACKET"` \| `"BOTTLE"` \| `"PLATE"` \| `"WINE_GLASS"` \| `"CUP"` \| `"FORK"` \| `"KNIFE"` \| `"SPOON"` \| `"BOWL"` \| `"BANANA"` \| `"APPLE"` \| `"SANDWICH"` \| `"ORANGE"` \| `"BROCCOLI"` \| `"CARROT"` \| `"HOT_DOG"` \| `"PIZZA"` \| `"DONUT"` \| `"CAKE"` \| `"CHAIR"` \| `"COUCH"` \| `"POTTED_PLANT"` \| `"BED"` \| `"MIRROR"` \| `"DINING_TABLE"` \| `"WINDOW"` \| `"DESK"` \| `"TOILET"` \| `"DOOR"` \| `"TV"` \| `"LAPTOP"` \| `"MOUSE"` \| `"REMOTE"` \| `"KEYBOARD"` \| `"CELL_PHONE"` \| `"MICROWAVE"` \| `"OVEN"` \| `"TOASTER"` \| `"SINK"` \| `"REFRIGERATOR"` \| `"BLENDER"` \| `"BOOK"` \| `"CLOCK"` \| `"VASE"` \| `"SCISSORS"` \| `"TEDDY_BEAR"` \| `"HAIR_DRIER"` \| `"TOOTHBRUSH"` \| `"HAIR_BRUSH"`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:30](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/objectDetection.ts#L30)

The class label of the detected object, represented as a key from the `CocoLabel` enum.

---

### score

> **score**: `number`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:31](https://github.com/software-mansion/react-native-executorch/blob/b5d7c2240b2bce86e529b0ca3bde7420456f9dbe/packages/react-native-executorch/src/types/objectDetection.ts#L31)

The confidence score of the detection, typically ranging from 0 to 1.
