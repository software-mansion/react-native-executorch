# Variable: models

> `const` **models**: `object`

Defined in: [models.ts:1852](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/models.ts#L1852)

Registry of pre-configured ExecuTorch models.

This provides Hugging Face repository URLs and baseline configurations for
tasks, allowing quick model loading and execution without manual option
setup.

Models published for more than one backend expose their exports as named
variants (`XNNPACK_INT8`, `COREML_FP16`, ...) plus a `DEFAULT` alias. The
alias is chosen for the device the app runs on: Core ML then MLX on iOS
hardware, Vulkan on Android, XNNPACK as the fallback everywhere and the only
option on the iOS simulator — always narrowed to the backends the app
actually linked in. Reach for a named variant to override that.

## Type Declaration

### classification

> **classification**: `object`

Image classification models that categorize input images into pre-defined
classes.

#### classification.EFFICIENTNET_V2_S

> **EFFICIENTNET_V2_S**: `object` & `object`

EfficientNetV2-S image classification model pre-trained on ImageNet-1k
(1000 categories, see [IMAGENET1K_LABELS](IMAGENET1K_LABELS.md)). Compact and efficient
architecture providing high accuracy for general-purpose image
classification.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`"tench, Tinca tinca"` \| `"goldfish, Carassius auratus"` \| `"great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias"` \| `"tiger shark, Galeocerdo cuvieri"` \| `"hammerhead, hammerhead shark"` \| `"electric ray, crampfish, numbfish, torpedo"` \| `"stingray"` \| `"cock"` \| `"hen"` \| `"ostrich, Struthio camelus"` \| `"brambling, Fringilla montifringilla"` \| `"goldfinch, Carduelis carduelis"` \| `"house finch, linnet, Carpodacus mexicanus"` \| `"junco, snowbird"` \| `"indigo bunting, indigo finch, indigo bird, Passerina cyanea"` \| `"robin, American robin, Turdus migratorius"` \| `"bulbul"` \| `"jay"` \| `"magpie"` \| `"chickadee"` \| `"water ouzel, dipper"` \| `"kite"` \| `"bald eagle, American eagle, Haliaeetus leucocephalus"` \| `"vulture"` \| `"great grey owl, great gray owl, Strix nebulosa"` \| `"European fire salamander, Salamandra salamandra"` \| `"common newt, Triturus vulgaris"` \| `"eft"` \| `"spotted salamander, Ambystoma maculatum"` \| `"axolotl, mud puppy, Ambystoma mexicanum"` \| `"bullfrog, Rana catesbeiana"` \| `"tree frog, tree-frog"` \| `"tailed frog, bell toad, ribbed toad, tailed toad, Ascaphus trui"` \| `"loggerhead, loggerhead turtle, Caretta caretta"` \| `"leatherback turtle, leatherback, leathery turtle, Dermochelys coriacea"` \| `"mud turtle"` \| `"terrapin"` \| `"box turtle, box tortoise"` \| `"banded gecko"` \| `"common iguana, iguana, Iguana iguana"` \| `"American chameleon, anole, Anolis carolenensis"` \| `"whiptail, whiptail lizard"` \| `"agama"` \| `"frilled lizard, Chlamydosaurus kingi"` \| `"alligator lizard"` \| `"Gila monster, Heloderma suspectum"` \| `"green lizard, Lacerta viridis"` \| `"African chameleon, Chamaeleo chamaeleon"` \| `"Komodo dragon, Komodo lizard, dragon lizard, giant lizard, Varanus komodoensis"` \| `"African crocodile, Nile crocodile, Crocodylus niloticus"` \| `"American alligator, Alligator mississipiensis"` \| `"triceratops"` \| `"thunder snake, worm snake, Carphophis amoenus"` \| `"ringneck snake, ring-necked snake, ring snake"` \| `"hognose snake, puff adder, sand viper"` \| `"green snake, grass snake"` \| `"king snake, kingsnake"` \| `"garter snake, grass snake"` \| `"water snake"` \| `"vine snake"` \| `"night snake, Hypsiglena torquata"` \| `"boa constrictor, Constrictor constrictor"` \| `"rock python, rock snake, Python sebae"` \| `"Indian cobra, Naja naja"` \| `"green mamba"` \| `"sea snake"` \| `"horned viper, cerastes, sand viper, horned asp, Cerastes cornutus"` \| `"diamondback, diamondback rattlesnake, Crotalus adamanteus"` \| `"sidewinder, horned rattlesnake, Crotalus cerastes"` \| `"trilobite"` \| `"harvestman, daddy longlegs, Phalangium opilio"` \| `"scorpion"` \| `"black and gold garden spider, Argiope aurantia"` \| `"barn spider, Araneus cavaticus"` \| `"garden spider, Aranea diademata"` \| `"black widow, Latrodectus mactans"` \| `"tarantula"` \| `"wolf spider, hunting spider"` \| `"tick"` \| `"centipede"` \| `"black grouse"` \| `"ptarmigan"` \| `"ruffed grouse, partridge, Bonasa umbellus"` \| `"prairie chicken, prairie grouse, prairie fowl"` \| `"peacock"` \| `"quail"` \| `"partridge"` \| `"African grey, African gray, Psittacus erithacus"` \| `"macaw"` \| `"sulphur-crested cockatoo, Kakatoe galerita, Cacatua galerita"` \| `"lorikeet"` \| `"coucal"` \| `"bee eater"` \| `"hornbill"` \| `"hummingbird"` \| `"jacamar"` \| `"toucan"` \| `"drake"` \| `"red-breasted merganser, Mergus serrator"` \| `"goose"` \| `"black swan, Cygnus atratus"` \| `"tusker"` \| `"echidna, spiny anteater, anteater"` \| `"platypus, duckbill, duckbilled platypus, duck-billed platypus, Ornithorhynchus anatinus"` \| `"wallaby, brush kangaroo"` \| `"koala, koala bear, kangaroo bear, native bear, Phascolarctos cinereus"` \| `"wombat"` \| `"jellyfish"` \| `"sea anemone, anemone"` \| `"brain coral"` \| `"flatworm, platyhelminth"` \| `"nematode, nematode worm, roundworm"` \| `"conch"` \| `"snail"` \| `"slug"` \| `"sea slug, nudibranch"` \| `"chiton, coat-of-mail shell, sea cradle, polyplacophore"` \| `"chambered nautilus, pearly nautilus, nautilus"` \| `"Dungeness crab, Cancer magister"` \| `"rock crab, Cancer irroratus"` \| `"fiddler crab"` \| `"king crab, Alaska crab, Alaskan king crab, Alaska king crab, Paralithodes camtschatica"` \| `"American lobster, Northern lobster, Maine lobster, Homarus americanus"` \| `"spiny lobster, langouste, rock lobster, crawfish, crayfish, sea crawfish"` \| `"crayfish, crawfish, crawdad, crawdaddy"` \| `"hermit crab"` \| `"isopod"` \| `"white stork, Ciconia ciconia"` \| `"black stork, Ciconia nigra"` \| `"spoonbill"` \| `"flamingo"` \| `"little blue heron, Egretta caerulea"` \| `"American egret, great white heron, Egretta albus"` \| `"bittern"` \| `"crane"` \| `"limpkin, Aramus pictus"` \| `"European gallinule, Porphyrio porphyrio"` \| `"American coot, marsh hen, mud hen, water hen, Fulica americana"` \| `"bustard"` \| `"ruddy turnstone, Arenaria interpres"` \| `"red-backed sandpiper, dunlin, Erolia alpina"` \| `"redshank, Tringa totanus"` \| `"dowitcher"` \| `"oystercatcher, oyster catcher"` \| `"pelican"` \| `"king penguin, Aptenodytes patagonica"` \| `"albatross, mollymawk"` \| `"grey whale, gray whale, devilfish, Eschrichtius gibbosus, Eschrichtius robustus"` \| `"killer whale, killer, orca, grampus, sea wolf, Orcinus orca"` \| `"dugong, Dugong dugon"` \| `"sea lion"` \| `"Chihuahua"` \| `"Japanese spaniel"` \| `"Maltese dog, Maltese terrier, Maltese"` \| `"Pekinese, Pekingese, Peke"` \| `"Shih-Tzu"` \| `"Blenheim spaniel"` \| `"papillon"` \| `"toy terrier"` \| `"Rhodesian ridgeback"` \| `"Afghan hound, Afghan"` \| `"basset, basset hound"` \| `"beagle"` \| `"bloodhound, sleuthhound"` \| `"bluetick"` \| `"black-and-tan coonhound"` \| `"Walker hound, Walker foxhound"` \| `"English foxhound"` \| `"redbone"` \| `"borzoi, Russian wolfhound"` \| `"Irish wolfhound"` \| `"Italian greyhound"` \| `"whippet"` \| `"Ibizan hound, Ibizan Podenco"` \| `"Norwegian elkhound, elkhound"` \| `"otterhound, otter hound"` \| `"Saluki, gazelle hound"` \| `"Scottish deerhound, deerhound"` \| `"Weimaraner"` \| `"Staffordshire bullterrier, Staffordshire bull terrier"` \| `"American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier"` \| `"Bedlington terrier"` \| `"Border terrier"` \| `"Kerry blue terrier"` \| `"Irish terrier"` \| `"Norfolk terrier"` \| `"Norwich terrier"` \| `"Yorkshire terrier"` \| `"wire-haired fox terrier"` \| `"Lakeland terrier"` \| `"Sealyham terrier, Sealyham"` \| `"Airedale, Airedale terrier"` \| `"cairn, cairn terrier"` \| `"Australian terrier"` \| `"Dandie Dinmont, Dandie Dinmont terrier"` \| `"Boston bull, Boston terrier"` \| `"miniature schnauzer"` \| `"giant schnauzer"` \| `"standard schnauzer"` \| `"Scotch terrier, Scottish terrier, Scottie"` \| `"Tibetan terrier, chrysanthemum dog"` \| `"silky terrier, Sydney silky"` \| `"soft-coated wheaten terrier"` \| `"West Highland white terrier"` \| `"Lhasa, Lhasa apso"` \| `"flat-coated retriever"` \| `"curly-coated retriever"` \| `"golden retriever"` \| `"Labrador retriever"` \| `"Chesapeake Bay retriever"` \| `"German short-haired pointer"` \| `"vizsla, Hungarian pointer"` \| `"English setter"` \| `"Irish setter, red setter"` \| `"Gordon setter"` \| `"Brittany spaniel"` \| `"clumber, clumber spaniel"` \| `"English springer, English springer spaniel"` \| `"Welsh springer spaniel"` \| `"cocker spaniel, English cocker spaniel, cocker"` \| `"Sussex spaniel"` \| `"Irish water spaniel"` \| `"kuvasz"` \| `"schipperke"` \| `"groenendael"` \| `"malinois"` \| `"briard"` \| `"kelpie"` \| `"komondor"` \| `"Old English sheepdog, bobtail"` \| `"Shetland sheepdog, Shetland sheep dog, Shetland"` \| `"collie"` \| `"Border collie"` \| `"Bouvier des Flandres, Bouviers des Flandres"` \| `"Rottweiler"` \| `"German shepherd, German shepherd dog, German police dog, alsatian"` \| `"Doberman, Doberman pinscher"` \| `"miniature pinscher"` \| `"Greater Swiss Mountain dog"` \| `"Bernese mountain dog"` \| `"Appenzeller"` \| `"EntleBucher"` \| `"boxer"` \| `"bull mastiff"` \| `"Tibetan mastiff"` \| `"French bulldog"` \| `"Great Dane"` \| `"Saint Bernard, St Bernard"` \| `"Eskimo dog, husky"` \| `"malamute, malemute, Alaskan malamute"` \| `"Siberian husky"` \| `"dalmatian, coach dog, carriage dog"` \| `"affenpinscher, monkey pinscher, monkey dog"` \| `"basenji"` \| `"pug, pug-dog"` \| `"Leonberg"` \| `"Newfoundland, Newfoundland dog"` \| `"Great Pyrenees"` \| `"Samoyed, Samoyede"` \| `"Pomeranian"` \| `"chow, chow chow"` \| `"keeshond"` \| `"Brabancon griffon"` \| `"Pembroke, Pembroke Welsh corgi"` \| `"Cardigan, Cardigan Welsh corgi"` \| `"toy poodle"` \| `"miniature poodle"` \| `"standard poodle"` \| `"Mexican hairless"` \| `"timber wolf, grey wolf, gray wolf, Canis lupus"` \| `"white wolf, Arctic wolf, Canis lupus tundrarum"` \| `"red wolf, maned wolf, Canis rufus, Canis niger"` \| `"coyote, prairie wolf, brush wolf, Canis latrans"` \| `"dingo, warrigal, warragal, Canis dingo"` \| `"dhole, Cuon alpinus"` \| `"African hunting dog, hyena dog, Cape hunting dog, Lycaon pictus"` \| `"hyena, hyaena"` \| `"red fox, Vulpes vulpes"` \| `"kit fox, Vulpes macrotis"` \| `"Arctic fox, white fox, Alopex lagopus"` \| `"grey fox, gray fox, Urocyon cinereoargenteus"` \| `"tabby, tabby cat"` \| `"tiger cat"` \| `"Persian cat"` \| `"Siamese cat, Siamese"` \| `"Egyptian cat"` \| `"cougar, puma, catamount, mountain lion, painter, panther, Felis concolor"` \| `"lynx, catamount"` \| `"leopard, Panthera pardus"` \| `"snow leopard, ounce, Panthera uncia"` \| `"jaguar, panther, Panthera onca, Felis onca"` \| `"lion, king of beasts, Panthera leo"` \| `"tiger, Panthera tigris"` \| `"cheetah, chetah, Acinonyx jubatus"` \| `"brown bear, bruin, Ursus arctos"` \| `"American black bear, black bear, Ursus americanus, Euarctos americanus"` \| `"ice bear, polar bear, Ursus Maritimus, Thalarctos maritimus"` \| `"sloth bear, Melursus ursinus, Ursus ursinus"` \| `"mongoose"` \| `"meerkat, mierkat"` \| `"tiger beetle"` \| `"ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle"` \| `"ground beetle, carabid beetle"` \| `"long-horned beetle, longicorn, longicorn beetle"` \| `"leaf beetle, chrysomelid"` \| `"dung beetle"` \| `"rhinoceros beetle"` \| `"weevil"` \| `"fly"` \| `"bee"` \| `"ant, emmet, pismire"` \| `"grasshopper, hopper"` \| `"cricket"` \| `"walking stick, walkingstick, stick insect"` \| `"cockroach, roach"` \| `"focused mantis, mantid"` \| `"cicada, cicala"` \| `"leafhopper"` \| `"lacewing, lacewing fly"` \| `"dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk"` \| `"damselfly"` \| `"admiral"` \| `"ringlet, ringlet butterfly"` \| `"monarch, monarch butterfly, milkweed butterfly, Danaus plexippus"` \| `"cabbage butterfly"` \| `"sulphur butterfly, sulfur butterfly"` \| `"lycaenid, lycaenid butterfly"` \| `"starfish, sea star"` \| `"sea urchin"` \| `"sea cucumber, holothurian"` \| `"wood rabbit, cottontail, cottontail rabbit"` \| `"hare"` \| `"Angora, Angora rabbit"` \| `"hamster"` \| `"porcupine, hedgehog"` \| `"fox squirrel, eastern fox squirrel, Sciurus niger"` \| `"marmot"` \| `"beaver"` \| `"guinea pig, Cavia cobaya"` \| `"sorrel"` \| `"zebra"` \| `"hog, pig, grunter, squealer, Sus scrofa"` \| `"wild boar, boar, Sus scrofa"` \| `"warthog"` \| `"hippopotamus, hippo, river horse, Hippopotamus amphibius"` \| `"ox"` \| `"water buffalo, water ox, Asiatic buffalo, Bubalus bubalis"` \| `"bison"` \| `"ram, tup"` \| `"bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis"` \| `"ibex, Capra ibex"` \| `"hartebeest"` \| `"impala, Aepyceros melampus"` \| `"gazelle"` \| `"Arabian camel, dromedary, Camelus dromedarius"` \| `"llama"` \| `"weasel"` \| `"mink"` \| `"polecat, fitch, foulmart, foumart, Mustela putorius"` \| `"black-footed ferret, ferret, Mustela nigripes"` \| `"otter"` \| `"skunk, polecat, wood pussy"` \| `"badger"` \| `"armadillo"` \| `"three-toed sloth, ai, Bradypus tridactylus"` \| `"orangutan, orang, orangutang, Pongo pygmaeus"` \| `"gorilla, Gorilla gorilla"` \| `"chimpanzee, chimp, Pan troglodytes"` \| `"gibbon, Hylobates lar"` \| `"siamang, Hylobates syndactylus, Symphalangus syndactylus"` \| `"guenon, guenon monkey"` \| `"patas, hussar monkey, Erythrocebus patas"` \| `"baboon"` \| `"macaque"` \| `"langur"` \| `"colobus, colobus monkey"` \| `"proboscis monkey, Nasalis larvatus"` \| `"marmoset"` \| `"capuchin, ringtail, Cebus capucinus"` \| `"howler monkey, howler"` \| `"titi, titi monkey"` \| `"spider monkey, Ateles geoffroyi"` \| `"squirrel monkey, Saimiri sciureus"` \| `"Madagascar cat, ring-tailed lemur, Lemur catta"` \| `"indri, indris, Indri indri, Indri brevicaudatus"` \| `"Indian elephant, Elephas maximus"` \| `"African elephant, Loxodonta africana"` \| `"lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens"` \| `"giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca"` \| `"barracouta, snoek"` \| `"raw eel, eel"` \| `"coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch"` \| `"rock beauty, Holocanthus tricolor"` \| `"anemone fish"` \| `"sturgeon"` \| `"gar, garfish, garpike, billfish, Lepisosteus osseus"` \| `"lionfish"` \| `"puffer, pufferfish, blowfish, globefish"` \| `"abacus"` \| `"abaya"` \| `"academic gown, academic robe, judge's robe"` \| `"accordion, piano accordion, squeeze box"` \| `"acoustic guitar"` \| `"aircraft carrier, carrier, flattop, attack aircraft carrier"` \| `"airliner"` \| `"airship, dirigible"` \| `"altar"` \| `"ambulance"` \| `"amphibian, amphibious vehicle"` \| `"analog clock"` \| `"apiary, bee house"` \| `"apron"` \| `"ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin"` \| `"assault rifle, assault gun"` \| `"backpack, back pack, knapsack, packsack, rucksack, haversack"` \| `"bakery, bakeshop, bakehouse"` \| `"balance beam, beam"` \| `"balloon"` \| `"ballpoint, ballpoint pen, ballpen, Biro"` \| `"Band Aid"` \| `"banjo"` \| `"bannister, banister, balustrade, balusters, handrail"` \| `"barbell"` \| `"barber chair"` \| `"barbershop"` \| `"barn"` \| `"barometer"` \| `"barrel, cask"` \| `"barrow, garden cart, lawn cart, wheelbarrow"` \| `"baseball"` \| `"basketball"` \| `"bassinet"` \| `"bassoon"` \| `"bathing cap, swimming cap"` \| `"bath towel"` \| `"bathtub, bathing tub, bath, tub"` \| `"beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon"` \| `"beacon, lighthouse, beacon light, pharos"` \| `"beaker"` \| `"bearskin, busby, shako"` \| `"beer bottle"` \| `"beer glass"` \| `"bell cote, bell cot"` \| `"bib"` \| `"bicycle-built-for-two, tandem bicycle, tandem"` \| `"bikini, two-piece"` \| `"binder, ring-binder"` \| `"binoculars, field glasses, opera glasses"` \| `"birdhouse"` \| `"boathouse"` \| `"bobsled, bobsleigh, bob"` \| `"bolo tie, bolo, bola tie, bola"` \| `"bonnet, poke bonnet"` \| `"bookcase"` \| `"bookshop, bookstore, bookstall"` \| `"bottlecap"` \| `"bow"` \| `"bow tie, bow-tie, bowtie"` \| `"brass, memorial tablet, plaque"` \| `"brassiere, bra, bandeau"` \| `"breakwater, groin, groyne, mole, bulwark, seawall, jetty"` \| `"breastplate, aegis, egis"` \| `"broom"` \| `"bucket, pail"` \| `"buckle"` \| `"bulletproof vest"` \| `"bullet train, bullet"` \| `"butcher shop, meat market"` \| `"cab, hack, taxi, taxicab"` \| `"caldron, cauldron"` \| `"candle, taper, wax light"` \| `"cannon"` \| `"canoe"` \| `"can opener, tin opener"` \| `"cardigan"` \| `"car mirror"` \| `"carousel, carrousel, merry-go-round, roundabout, whirligig"` \| `"carpenter's kit, tool kit"` \| `"carton"` \| `"car wheel"` \| `"cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM"` \| `"cassette"` \| `"cassette player"` \| `"castle"` \| `"catamaran"` \| `"CD player"` \| `"cello, violoncello"` \| `"cellular telephone, cellular phone, cellphone, cell, mobile phone"` \| `"chain"` \| `"chainlink fence"` \| `"chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour"` \| `"chain saw, chainsaw"` \| `"chest"` \| `"chiffonier, commode"` \| `"chime, bell, gong"` \| `"china cabinet, china closet"` \| `"Christmas stocking"` \| `"church, church building"` \| `"cinema, movie theater, movie theatre, movie house, picture palace"` \| `"cleaver, meat cleaver, chopper"` \| `"cliff dwelling"` \| `"cloak"` \| `"clog, geta, patten, sabot"` \| `"cocktail shaker"` \| `"coffee mug"` \| `"coffeepot"` \| `"coil, spiral, volute, whorl, helix"` \| `"combination lock"` \| `"computer keyboard, keypad"` \| `"confectionery, confectionery store, candy store"` \| `"container ship, containership, container vessel"` \| `"convertible"` \| `"corkscrew, bottle screw"` \| `"cornet, horn, trumpet, trump"` \| `"cowboy boot"` \| `"cowboy hat, ten-gallon hat"` \| `"cradle"` \| `"crash helmet"` \| `"crate"` \| `"crib, cot"` \| `"Crock Pot"` \| `"croquet ball"` \| `"crutch"` \| `"cuirass"` \| `"dam, dike, dyke"` \| `"desk"` \| `"desktop computer"` \| `"dial telephone, dial phone"` \| `"diaper, nappy, napkin"` \| `"digital clock"` \| `"digital watch"` \| `"dining table, board"` \| `"dishrag, dishcloth"` \| `"dishwasher, dish washer, dishwashing machine"` \| `"disk brake, disc brake"` \| `"dock, dockage, docking facility"` \| `"dogsled, dog sled, dog sleigh"` \| `"dome"` \| `"doormat, welcome mat"` \| `"drilling platform, offshore rig"` \| `"drum, membranophone, tympan"` \| `"drumstick"` \| `"dumbbell"` \| `"Dutch oven"` \| `"electric fan, blower"` \| `"electric guitar"` \| `"electric locomotive"` \| `"entertainment center"` \| `"envelope"` \| `"espresso maker"` \| `"face powder"` \| `"feather boa, boa"` \| `"file, file cabinet, filing cabinet"` \| `"fireboat"` \| `"fire engine, fire truck"` \| `"fire screen, fireguard"` \| `"flagpole, flagstaff"` \| `"flute, transverse flute"` \| `"folding chair"` \| `"football helmet"` \| `"forklift"` \| `"fountain"` \| `"fountain pen"` \| `"four-poster"` \| `"freight car"` \| `"French horn, horn"` \| `"frying pan, frypan, skillet"` \| `"fur coat"` \| `"garbage truck, dustcart"` \| `"gasmask, respirator, gas helmet"` \| `"gas pump, gasoline pump, petrol pump, island dispenser"` \| `"goblet"` \| `"go-kart"` \| `"golf ball"` \| `"golfcart, golf cart"` \| `"gondola"` \| `"gong, tam-tam"` \| `"gown"` \| `"grand piano, grand"` \| `"greenhouse, nursery, glasshouse"` \| `"grille, radiator grille"` \| `"grocery store, grocery, food market, market"` \| `"guillotine"` \| `"hair slide"` \| `"hair spray"` \| `"half track"` \| `"hammer"` \| `"hamper"` \| `"hand blower, blow dryer, blow drier, hair dryer, hair drier"` \| `"hand-held computer, hand-held microcomputer"` \| `"handkerchief, hankie, hanky, hankey"` \| `"hard disc, hard disk, fixed disk"` \| `"harmonica, mouth organ, harp, mouth harp"` \| `"harp"` \| `"harvester, reaper"` \| `"hatchet"` \| `"holster"` \| `"home theater, home theatre"` \| `"honeycomb"` \| `"hook, claw"` \| `"hoopskirt, crinoline"` \| `"horizontal bar, high bar"` \| `"horse cart, horse-cart"` \| `"hourglass"` \| `"iPod"` \| `"iron, smoothing iron"` \| `"jack-o'-lantern"` \| `"jean, blue jean, denim"` \| `"jeep, landrover"` \| `"jersey, T-shirt, tee shirt"` \| `"jigsaw puzzle"` \| `"jinrikisha, ricksha, rickshaw"` \| `"joystick"` \| `"kimono"` \| `"knee pad"` \| `"knot"` \| `"lab coat, laboratory coat"` \| `"ladle"` \| `"lampshade, lamp shade"` \| `"laptop, laptop computer"` \| `"lawn mower, mower"` \| `"lens cap, lens cover"` \| `"letter opener, paper knife, paperknife"` \| `"library"` \| `"lifeboat"` \| `"lighter, light, igniter, ignitor"` \| `"limousine, limo"` \| `"liner, ocean liner"` \| `"lipstick, lip rouge"` \| `"Loafer"` \| `"lotion"` \| `"loudspeaker, speaker, speaker unit, loudspeaker system, speaker system"` \| `"loupe, jeweler's loupe"` \| `"lumbermill, sawmill"` \| `"magnetic compass"` \| `"mailbag, postbag"` \| `"mailbox, letter box"` \| `"maillot"` \| `"maillot, tank suit"` \| `"manhole cover"` \| `"maraca"` \| `"marimba, xylophone"` \| `"mask"` \| `"matchstick"` \| `"maypole"` \| `"maze, labyrinth"` \| `"measuring cup"` \| `"medicine chest, medicine cabinet"` \| `"megalith, megalithic structure"` \| `"microphone, mike"` \| `"microwave, microwave oven"` \| `"military uniform"` \| `"milk can"` \| `"minibus"` \| `"miniskirt, mini"` \| `"minivan"` \| `"missile"` \| `"mitten"` \| `"mixing bowl"` \| `"mobile home, manufactured home"` \| `"Model T"` \| `"modem"` \| `"monastery"` \| `"monitor"` \| `"moped"` \| `"mortar"` \| `"mortarboard"` \| `"mosque"` \| `"mosquito net"` \| `"motor scooter, scooter"` \| `"mountain bike, all-terrain bike, off-roader"` \| `"mountain tent"` \| `"mouse, computer mouse"` \| `"mousetrap"` \| `"moving van"` \| `"muzzle"` \| `"nail"` \| `"neck brace"` \| `"necklace"` \| `"nipple"` \| `"notebook, notebook computer"` \| `"obelisk"` \| `"oboe, hautboy, hautbois"` \| `"ocarina, sweet potato"` \| `"odometer, hodometer, mileometer, milometer"` \| `"oil filter"` \| `"organ, pipe organ"` \| `"oscilloscope, scope, cathode-ray oscilloscope, CRO"` \| `"overskirt"` \| `"oxcart"` \| `"oxygen mask"` \| `"packet"` \| `"paddle, boat paddle"` \| `"paddlewheel, paddle wheel"` \| `"padlock"` \| `"paintbrush"` \| `"pajama, pyjama, pj's, jammies"` \| `"palace"` \| `"panpipe, pandean pipe, syrinx"` \| `"paper towel"` \| `"parachute, chute"` \| `"parallel bars, bars"` \| `"park bench"` \| `"parking meter"` \| `"passenger car, coach, carriage"` \| `"patio, terrace"` \| `"pay-phone, pay-station"` \| `"pedestal, plinth, footstall"` \| `"pencil box, pencil case"` \| `"pencil sharpener"` \| `"perfume, essence"` \| `"Petri dish"` \| `"photocopier"` \| `"pick, plectrum, plectron"` \| `"pickelhaube"` \| `"picket fence, paling"` \| `"pickup, pickup truck"` \| `"pier"` \| `"piggy bank, penny bank"` \| `"pill bottle"` \| `"pillow"` \| `"ping-pong ball"` \| `"pinwheel"` \| `"pirate, pirate ship"` \| `"pitcher, ewer"` \| `"plane, carpenter's plane, woodworking plane"` \| `"planetarium"` \| `"plastic bag"` \| `"plate rack"` \| `"plow, plough"` \| `"plunger, plumber's helper"` \| `"Polaroid camera, Polaroid Land camera"` \| `"pole"` \| `"police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria"` \| `"poncho"` \| `"pool table, billiard table, snooker table"` \| `"pop bottle, soda bottle"` \| `"pot, flowerpot"` \| `"potter's wheel"` \| `"power drill"` \| `"prayer rug, prayer mat"` \| `"printer"` \| `"prison, prison house"` \| `"projectile, missile"` \| `"projector"` \| `"puck, hockey puck"` \| `"punching bag, punch bag, punching ball, punchball"` \| `"purse"` \| `"quill, quill pen"` \| `"quilt, comforter, comfort, puff"` \| `"racer, race car, racing car"` \| `"racket, racquet"` \| `"radiator"` \| `"radio, wireless"` \| `"radio telescope, radio reflector"` \| `"rain barrel"` \| `"recreational vehicle, RV, R.V."` \| `"reel"` \| `"reflex camera"` \| `"refrigerator, icebox"` \| `"remote control, remote"` \| `"restaurant, eating house, eating place, eatery"` \| `"revolver, six-gun, six-shooter"` \| `"rifle"` \| `"rocking chair, rocker"` \| `"rotisserie"` \| `"rubber eraser, rubber, pencil eraser"` \| `"rugby ball"` \| `"rule, ruler"` \| `"running shoe"` \| `"safe"` \| `"safety pin"` \| `"saltshaker, salt shaker"` \| `"sandal"` \| `"sarong"` \| `"sax, saxophone"` \| `"scabbard"` \| `"scale, weighing machine"` \| `"school bus"` \| `"schooner"` \| `"scoreboard"` \| `"screen, CRT screen"` \| `"screw"` \| `"screwdriver"` \| `"seat belt, seatbelt"` \| `"sewing machine"` \| `"shield, buckler"` \| `"shoe shop, shoe-shop, shoe store"` \| `"shoji"` \| `"shopping basket"` \| `"shopping cart"` \| `"shovel"` \| `"shower cap"` \| `"shower curtain"` \| `"ski"` \| `"ski mask"` \| `"sleeping bag"` \| `"slide rule, slipstick"` \| `"sliding door"` \| `"slot, one-armed bandit"` \| `"snorkel"` \| `"snowmobile"` \| `"snowplow, snowplough"` \| `"soap dispenser"` \| `"soccer ball"` \| `"sock"` \| `"solar dish, solar collector, solar furnace"` \| `"sombrero"` \| `"soup bowl"` \| `"space bar"` \| `"space heater"` \| `"space shuttle"` \| `"spatula"` \| `"speedboat"` \| `"spider web, spider's web"` \| `"spindle"` \| `"sports car, sport car"` \| `"spotlight, spot"` \| `"stage"` \| `"steam locomotive"` \| `"steel arch bridge"` \| `"steel drum"` \| `"stethoscope"` \| `"stole"` \| `"stone wall"` \| `"stopwatch, stop watch"` \| `"stove"` \| `"strainer"` \| `"streetcar, tram, tramcar, trolley, trolley car"` \| `"stretcher"` \| `"studio couch, day bed"` \| `"stupa, tope"` \| `"submarine, pigboat, sub, U-boat"` \| `"suit, suit of clothes"` \| `"sundial"` \| `"sunglass"` \| `"sunglasses, dark glasses, shades"` \| `"sunscreen, sunblock, sun blocker"` \| `"suspension bridge"` \| `"swab, swob, mop"` \| `"sweatshirt"` \| `"swimming trunks, bathing trunks"` \| `"swing"` \| `"switch, electric switch, electrical switch"` \| `"syringe"` \| `"table lamp"` \| `"tank, army tank, armored combat vehicle, armoured combat vehicle"` \| `"tape player"` \| `"teapot"` \| `"teddy, teddy bear"` \| `"television, television system"` \| `"tennis ball"` \| `"thatch, thatched roof"` \| `"theater curtain, theatre curtain"` \| `"thimble"` \| `"thresher, thrasher, threshing machine"` \| `"throne"` \| `"tile roof"` \| `"toaster"` \| `"tobacco shop, tobacconist shop, tobacconist"` \| `"toilet seat"` \| `"torch"` \| `"totem pole"` \| `"tow truck, tow car, wrecker"` \| `"toyshop"` \| `"tractor"` \| `"trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi"` \| `"tray"` \| `"trench coat"` \| `"tricycle, trike, velocipede"` \| `"trimaran"` \| `"tripod"` \| `"triumphal arch"` \| `"trolleybus, trolley coach, trackless trolley"` \| `"trombone"` \| `"tub, vat"` \| `"turnstile"` \| `"typewriter keyboard"` \| `"umbrella"` \| `"unicycle, monocycle"` \| `"upright, upright piano"` \| `"vacuum, vacuum cleaner"` \| `"vase"` \| `"vault"` \| `"velvet"` \| `"vending machine"` \| `"vestment"` \| `"viaduct"` \| `"violin, fiddle"` \| `"volleyball"` \| `"waffle iron"` \| `"wall clock"` \| `"wallet, billfold, notecase, pocketbook"` \| `"wardrobe, closet, press"` \| `"warplane, military plane"` \| `"washbasin, handbasin, washbowl, lavabo, wash-hand basin"` \| `"washer, automatic washer, washing machine"` \| `"water bottle"` \| `"water jug"` \| `"water tower"` \| `"whiskey jug"` \| `"whistle"` \| `"wig"` \| `"window screen"` \| `"window shade"` \| `"Windsor tie"` \| `"wine bottle"` \| `"wing"` \| `"wok"` \| `"wooden spoon"` \| `"wool, woolen, woollen"` \| `"worm fence, snake fence, snake-rail fence, Virginia fence"` \| `"wreck"` \| `"yawl"` \| `"yurt"` \| `"web site, website, internet site, site"` \| `"comic book"` \| `"crossword puzzle, crossword"` \| `"street sign"` \| `"traffic light, traffic signal, stoplight"` \| `"book jacket, dust cover, dust jacket, dust wrapper"` \| `"menu"` \| `"plate"` \| `"guacamole"` \| `"consomme"` \| `"hot pot, hotpot"` \| `"trifle"` \| `"ice cream, icecream"` \| `"ice lolly, lolly, lollipop, popsicle"` \| `"French loaf"` \| `"bagel, beigel"` \| `"pretzel"` \| `"cheeseburger"` \| `"hotdog, hot dog, red hot"` \| `"mashed potato"` \| `"head cabbage"` \| `"broccoli"` \| `"cauliflower"` \| `"zucchini, courgette"` \| `"spaghetti squash"` \| `"acorn squash"` \| `"butternut squash"` \| `"cucumber, cuke"` \| `"artichoke, globe artichoke"` \| `"bell pepper"` \| `"cardoon"` \| `"mushroom"` \| `"Granny Smith"` \| `"strawberry"` \| `"orange"` \| `"lemon"` \| `"fig"` \| `"pineapple, ananas"` \| `"banana"` \| `"jackfruit, jak, jack"` \| `"custard apple"` \| `"pomegranate"` \| `"hay"` \| `"carbonara"` \| `"chocolate sauce, chocolate syrup"` \| `"dough"` \| `"meat loaf, meatloaf"` \| `"pizza, pizza pie"` \| `"potpie"` \| `"burrito"` \| `"red wine"` \| `"espresso"` \| `"cup"` \| `"eggnog"` \| `"alp"` \| `"bubble"` \| `"cliff, drop, drop-off"` \| `"coral reef"` \| `"geyser"` \| `"lakeside, lakeside road, lakeshore"` \| `"promontory, headland, head, foreland"` \| `"sandbar, sand bar"` \| `"seashore, coast, seacoast, sea-coast"` \| `"valley, vale"` \| `"volcano"` \| `"ballplayer, baseball player"` \| `"groom, bridegroom"` \| `"scuba diver"` \| `"rapeseed"` \| `"daisy"` \| `"yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum"` \| `"corn"` \| `"acorn"` \| `"hip, rose hip, rosehip"` \| `"buckeye, horse chestnut, conker"` \| `"coral fungus"` \| `"agaric"` \| `"gyromitra"` \| `"stinkhorn, carrion fungus"` \| `"earthstar"` \| `"hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa"` \| `"bolete"` \| `"ear, spike, capitulum"` \| `"toilet tissue, toilet paper, bathroom tissue"`\> = `EFFICIENTNET_V2_S_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`"tench, Tinca tinca"` \| `"goldfish, Carassius auratus"` \| `"great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias"` \| `"tiger shark, Galeocerdo cuvieri"` \| `"hammerhead, hammerhead shark"` \| `"electric ray, crampfish, numbfish, torpedo"` \| `"stingray"` \| `"cock"` \| `"hen"` \| `"ostrich, Struthio camelus"` \| `"brambling, Fringilla montifringilla"` \| `"goldfinch, Carduelis carduelis"` \| `"house finch, linnet, Carpodacus mexicanus"` \| `"junco, snowbird"` \| `"indigo bunting, indigo finch, indigo bird, Passerina cyanea"` \| `"robin, American robin, Turdus migratorius"` \| `"bulbul"` \| `"jay"` \| `"magpie"` \| `"chickadee"` \| `"water ouzel, dipper"` \| `"kite"` \| `"bald eagle, American eagle, Haliaeetus leucocephalus"` \| `"vulture"` \| `"great grey owl, great gray owl, Strix nebulosa"` \| `"European fire salamander, Salamandra salamandra"` \| `"common newt, Triturus vulgaris"` \| `"eft"` \| `"spotted salamander, Ambystoma maculatum"` \| `"axolotl, mud puppy, Ambystoma mexicanum"` \| `"bullfrog, Rana catesbeiana"` \| `"tree frog, tree-frog"` \| `"tailed frog, bell toad, ribbed toad, tailed toad, Ascaphus trui"` \| `"loggerhead, loggerhead turtle, Caretta caretta"` \| `"leatherback turtle, leatherback, leathery turtle, Dermochelys coriacea"` \| `"mud turtle"` \| `"terrapin"` \| `"box turtle, box tortoise"` \| `"banded gecko"` \| `"common iguana, iguana, Iguana iguana"` \| `"American chameleon, anole, Anolis carolenensis"` \| `"whiptail, whiptail lizard"` \| `"agama"` \| `"frilled lizard, Chlamydosaurus kingi"` \| `"alligator lizard"` \| `"Gila monster, Heloderma suspectum"` \| `"green lizard, Lacerta viridis"` \| `"African chameleon, Chamaeleo chamaeleon"` \| `"Komodo dragon, Komodo lizard, dragon lizard, giant lizard, Varanus komodoensis"` \| `"African crocodile, Nile crocodile, Crocodylus niloticus"` \| `"American alligator, Alligator mississipiensis"` \| `"triceratops"` \| `"thunder snake, worm snake, Carphophis amoenus"` \| `"ringneck snake, ring-necked snake, ring snake"` \| `"hognose snake, puff adder, sand viper"` \| `"green snake, grass snake"` \| `"king snake, kingsnake"` \| `"garter snake, grass snake"` \| `"water snake"` \| `"vine snake"` \| `"night snake, Hypsiglena torquata"` \| `"boa constrictor, Constrictor constrictor"` \| `"rock python, rock snake, Python sebae"` \| `"Indian cobra, Naja naja"` \| `"green mamba"` \| `"sea snake"` \| `"horned viper, cerastes, sand viper, horned asp, Cerastes cornutus"` \| `"diamondback, diamondback rattlesnake, Crotalus adamanteus"` \| `"sidewinder, horned rattlesnake, Crotalus cerastes"` \| `"trilobite"` \| `"harvestman, daddy longlegs, Phalangium opilio"` \| `"scorpion"` \| `"black and gold garden spider, Argiope aurantia"` \| `"barn spider, Araneus cavaticus"` \| `"garden spider, Aranea diademata"` \| `"black widow, Latrodectus mactans"` \| `"tarantula"` \| `"wolf spider, hunting spider"` \| `"tick"` \| `"centipede"` \| `"black grouse"` \| `"ptarmigan"` \| `"ruffed grouse, partridge, Bonasa umbellus"` \| `"prairie chicken, prairie grouse, prairie fowl"` \| `"peacock"` \| `"quail"` \| `"partridge"` \| `"African grey, African gray, Psittacus erithacus"` \| `"macaw"` \| `"sulphur-crested cockatoo, Kakatoe galerita, Cacatua galerita"` \| `"lorikeet"` \| `"coucal"` \| `"bee eater"` \| `"hornbill"` \| `"hummingbird"` \| `"jacamar"` \| `"toucan"` \| `"drake"` \| `"red-breasted merganser, Mergus serrator"` \| `"goose"` \| `"black swan, Cygnus atratus"` \| `"tusker"` \| `"echidna, spiny anteater, anteater"` \| `"platypus, duckbill, duckbilled platypus, duck-billed platypus, Ornithorhynchus anatinus"` \| `"wallaby, brush kangaroo"` \| `"koala, koala bear, kangaroo bear, native bear, Phascolarctos cinereus"` \| `"wombat"` \| `"jellyfish"` \| `"sea anemone, anemone"` \| `"brain coral"` \| `"flatworm, platyhelminth"` \| `"nematode, nematode worm, roundworm"` \| `"conch"` \| `"snail"` \| `"slug"` \| `"sea slug, nudibranch"` \| `"chiton, coat-of-mail shell, sea cradle, polyplacophore"` \| `"chambered nautilus, pearly nautilus, nautilus"` \| `"Dungeness crab, Cancer magister"` \| `"rock crab, Cancer irroratus"` \| `"fiddler crab"` \| `"king crab, Alaska crab, Alaskan king crab, Alaska king crab, Paralithodes camtschatica"` \| `"American lobster, Northern lobster, Maine lobster, Homarus americanus"` \| `"spiny lobster, langouste, rock lobster, crawfish, crayfish, sea crawfish"` \| `"crayfish, crawfish, crawdad, crawdaddy"` \| `"hermit crab"` \| `"isopod"` \| `"white stork, Ciconia ciconia"` \| `"black stork, Ciconia nigra"` \| `"spoonbill"` \| `"flamingo"` \| `"little blue heron, Egretta caerulea"` \| `"American egret, great white heron, Egretta albus"` \| `"bittern"` \| `"crane"` \| `"limpkin, Aramus pictus"` \| `"European gallinule, Porphyrio porphyrio"` \| `"American coot, marsh hen, mud hen, water hen, Fulica americana"` \| `"bustard"` \| `"ruddy turnstone, Arenaria interpres"` \| `"red-backed sandpiper, dunlin, Erolia alpina"` \| `"redshank, Tringa totanus"` \| `"dowitcher"` \| `"oystercatcher, oyster catcher"` \| `"pelican"` \| `"king penguin, Aptenodytes patagonica"` \| `"albatross, mollymawk"` \| `"grey whale, gray whale, devilfish, Eschrichtius gibbosus, Eschrichtius robustus"` \| `"killer whale, killer, orca, grampus, sea wolf, Orcinus orca"` \| `"dugong, Dugong dugon"` \| `"sea lion"` \| `"Chihuahua"` \| `"Japanese spaniel"` \| `"Maltese dog, Maltese terrier, Maltese"` \| `"Pekinese, Pekingese, Peke"` \| `"Shih-Tzu"` \| `"Blenheim spaniel"` \| `"papillon"` \| `"toy terrier"` \| `"Rhodesian ridgeback"` \| `"Afghan hound, Afghan"` \| `"basset, basset hound"` \| `"beagle"` \| `"bloodhound, sleuthhound"` \| `"bluetick"` \| `"black-and-tan coonhound"` \| `"Walker hound, Walker foxhound"` \| `"English foxhound"` \| `"redbone"` \| `"borzoi, Russian wolfhound"` \| `"Irish wolfhound"` \| `"Italian greyhound"` \| `"whippet"` \| `"Ibizan hound, Ibizan Podenco"` \| `"Norwegian elkhound, elkhound"` \| `"otterhound, otter hound"` \| `"Saluki, gazelle hound"` \| `"Scottish deerhound, deerhound"` \| `"Weimaraner"` \| `"Staffordshire bullterrier, Staffordshire bull terrier"` \| `"American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier"` \| `"Bedlington terrier"` \| `"Border terrier"` \| `"Kerry blue terrier"` \| `"Irish terrier"` \| `"Norfolk terrier"` \| `"Norwich terrier"` \| `"Yorkshire terrier"` \| `"wire-haired fox terrier"` \| `"Lakeland terrier"` \| `"Sealyham terrier, Sealyham"` \| `"Airedale, Airedale terrier"` \| `"cairn, cairn terrier"` \| `"Australian terrier"` \| `"Dandie Dinmont, Dandie Dinmont terrier"` \| `"Boston bull, Boston terrier"` \| `"miniature schnauzer"` \| `"giant schnauzer"` \| `"standard schnauzer"` \| `"Scotch terrier, Scottish terrier, Scottie"` \| `"Tibetan terrier, chrysanthemum dog"` \| `"silky terrier, Sydney silky"` \| `"soft-coated wheaten terrier"` \| `"West Highland white terrier"` \| `"Lhasa, Lhasa apso"` \| `"flat-coated retriever"` \| `"curly-coated retriever"` \| `"golden retriever"` \| `"Labrador retriever"` \| `"Chesapeake Bay retriever"` \| `"German short-haired pointer"` \| `"vizsla, Hungarian pointer"` \| `"English setter"` \| `"Irish setter, red setter"` \| `"Gordon setter"` \| `"Brittany spaniel"` \| `"clumber, clumber spaniel"` \| `"English springer, English springer spaniel"` \| `"Welsh springer spaniel"` \| `"cocker spaniel, English cocker spaniel, cocker"` \| `"Sussex spaniel"` \| `"Irish water spaniel"` \| `"kuvasz"` \| `"schipperke"` \| `"groenendael"` \| `"malinois"` \| `"briard"` \| `"kelpie"` \| `"komondor"` \| `"Old English sheepdog, bobtail"` \| `"Shetland sheepdog, Shetland sheep dog, Shetland"` \| `"collie"` \| `"Border collie"` \| `"Bouvier des Flandres, Bouviers des Flandres"` \| `"Rottweiler"` \| `"German shepherd, German shepherd dog, German police dog, alsatian"` \| `"Doberman, Doberman pinscher"` \| `"miniature pinscher"` \| `"Greater Swiss Mountain dog"` \| `"Bernese mountain dog"` \| `"Appenzeller"` \| `"EntleBucher"` \| `"boxer"` \| `"bull mastiff"` \| `"Tibetan mastiff"` \| `"French bulldog"` \| `"Great Dane"` \| `"Saint Bernard, St Bernard"` \| `"Eskimo dog, husky"` \| `"malamute, malemute, Alaskan malamute"` \| `"Siberian husky"` \| `"dalmatian, coach dog, carriage dog"` \| `"affenpinscher, monkey pinscher, monkey dog"` \| `"basenji"` \| `"pug, pug-dog"` \| `"Leonberg"` \| `"Newfoundland, Newfoundland dog"` \| `"Great Pyrenees"` \| `"Samoyed, Samoyede"` \| `"Pomeranian"` \| `"chow, chow chow"` \| `"keeshond"` \| `"Brabancon griffon"` \| `"Pembroke, Pembroke Welsh corgi"` \| `"Cardigan, Cardigan Welsh corgi"` \| `"toy poodle"` \| `"miniature poodle"` \| `"standard poodle"` \| `"Mexican hairless"` \| `"timber wolf, grey wolf, gray wolf, Canis lupus"` \| `"white wolf, Arctic wolf, Canis lupus tundrarum"` \| `"red wolf, maned wolf, Canis rufus, Canis niger"` \| `"coyote, prairie wolf, brush wolf, Canis latrans"` \| `"dingo, warrigal, warragal, Canis dingo"` \| `"dhole, Cuon alpinus"` \| `"African hunting dog, hyena dog, Cape hunting dog, Lycaon pictus"` \| `"hyena, hyaena"` \| `"red fox, Vulpes vulpes"` \| `"kit fox, Vulpes macrotis"` \| `"Arctic fox, white fox, Alopex lagopus"` \| `"grey fox, gray fox, Urocyon cinereoargenteus"` \| `"tabby, tabby cat"` \| `"tiger cat"` \| `"Persian cat"` \| `"Siamese cat, Siamese"` \| `"Egyptian cat"` \| `"cougar, puma, catamount, mountain lion, painter, panther, Felis concolor"` \| `"lynx, catamount"` \| `"leopard, Panthera pardus"` \| `"snow leopard, ounce, Panthera uncia"` \| `"jaguar, panther, Panthera onca, Felis onca"` \| `"lion, king of beasts, Panthera leo"` \| `"tiger, Panthera tigris"` \| `"cheetah, chetah, Acinonyx jubatus"` \| `"brown bear, bruin, Ursus arctos"` \| `"American black bear, black bear, Ursus americanus, Euarctos americanus"` \| `"ice bear, polar bear, Ursus Maritimus, Thalarctos maritimus"` \| `"sloth bear, Melursus ursinus, Ursus ursinus"` \| `"mongoose"` \| `"meerkat, mierkat"` \| `"tiger beetle"` \| `"ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle"` \| `"ground beetle, carabid beetle"` \| `"long-horned beetle, longicorn, longicorn beetle"` \| `"leaf beetle, chrysomelid"` \| `"dung beetle"` \| `"rhinoceros beetle"` \| `"weevil"` \| `"fly"` \| `"bee"` \| `"ant, emmet, pismire"` \| `"grasshopper, hopper"` \| `"cricket"` \| `"walking stick, walkingstick, stick insect"` \| `"cockroach, roach"` \| `"focused mantis, mantid"` \| `"cicada, cicala"` \| `"leafhopper"` \| `"lacewing, lacewing fly"` \| `"dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk"` \| `"damselfly"` \| `"admiral"` \| `"ringlet, ringlet butterfly"` \| `"monarch, monarch butterfly, milkweed butterfly, Danaus plexippus"` \| `"cabbage butterfly"` \| `"sulphur butterfly, sulfur butterfly"` \| `"lycaenid, lycaenid butterfly"` \| `"starfish, sea star"` \| `"sea urchin"` \| `"sea cucumber, holothurian"` \| `"wood rabbit, cottontail, cottontail rabbit"` \| `"hare"` \| `"Angora, Angora rabbit"` \| `"hamster"` \| `"porcupine, hedgehog"` \| `"fox squirrel, eastern fox squirrel, Sciurus niger"` \| `"marmot"` \| `"beaver"` \| `"guinea pig, Cavia cobaya"` \| `"sorrel"` \| `"zebra"` \| `"hog, pig, grunter, squealer, Sus scrofa"` \| `"wild boar, boar, Sus scrofa"` \| `"warthog"` \| `"hippopotamus, hippo, river horse, Hippopotamus amphibius"` \| `"ox"` \| `"water buffalo, water ox, Asiatic buffalo, Bubalus bubalis"` \| `"bison"` \| `"ram, tup"` \| `"bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis"` \| `"ibex, Capra ibex"` \| `"hartebeest"` \| `"impala, Aepyceros melampus"` \| `"gazelle"` \| `"Arabian camel, dromedary, Camelus dromedarius"` \| `"llama"` \| `"weasel"` \| `"mink"` \| `"polecat, fitch, foulmart, foumart, Mustela putorius"` \| `"black-footed ferret, ferret, Mustela nigripes"` \| `"otter"` \| `"skunk, polecat, wood pussy"` \| `"badger"` \| `"armadillo"` \| `"three-toed sloth, ai, Bradypus tridactylus"` \| `"orangutan, orang, orangutang, Pongo pygmaeus"` \| `"gorilla, Gorilla gorilla"` \| `"chimpanzee, chimp, Pan troglodytes"` \| `"gibbon, Hylobates lar"` \| `"siamang, Hylobates syndactylus, Symphalangus syndactylus"` \| `"guenon, guenon monkey"` \| `"patas, hussar monkey, Erythrocebus patas"` \| `"baboon"` \| `"macaque"` \| `"langur"` \| `"colobus, colobus monkey"` \| `"proboscis monkey, Nasalis larvatus"` \| `"marmoset"` \| `"capuchin, ringtail, Cebus capucinus"` \| `"howler monkey, howler"` \| `"titi, titi monkey"` \| `"spider monkey, Ateles geoffroyi"` \| `"squirrel monkey, Saimiri sciureus"` \| `"Madagascar cat, ring-tailed lemur, Lemur catta"` \| `"indri, indris, Indri indri, Indri brevicaudatus"` \| `"Indian elephant, Elephas maximus"` \| `"African elephant, Loxodonta africana"` \| `"lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens"` \| `"giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca"` \| `"barracouta, snoek"` \| `"raw eel, eel"` \| `"coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch"` \| `"rock beauty, Holocanthus tricolor"` \| `"anemone fish"` \| `"sturgeon"` \| `"gar, garfish, garpike, billfish, Lepisosteus osseus"` \| `"lionfish"` \| `"puffer, pufferfish, blowfish, globefish"` \| `"abacus"` \| `"abaya"` \| `"academic gown, academic robe, judge's robe"` \| `"accordion, piano accordion, squeeze box"` \| `"acoustic guitar"` \| `"aircraft carrier, carrier, flattop, attack aircraft carrier"` \| `"airliner"` \| `"airship, dirigible"` \| `"altar"` \| `"ambulance"` \| `"amphibian, amphibious vehicle"` \| `"analog clock"` \| `"apiary, bee house"` \| `"apron"` \| `"ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin"` \| `"assault rifle, assault gun"` \| `"backpack, back pack, knapsack, packsack, rucksack, haversack"` \| `"bakery, bakeshop, bakehouse"` \| `"balance beam, beam"` \| `"balloon"` \| `"ballpoint, ballpoint pen, ballpen, Biro"` \| `"Band Aid"` \| `"banjo"` \| `"bannister, banister, balustrade, balusters, handrail"` \| `"barbell"` \| `"barber chair"` \| `"barbershop"` \| `"barn"` \| `"barometer"` \| `"barrel, cask"` \| `"barrow, garden cart, lawn cart, wheelbarrow"` \| `"baseball"` \| `"basketball"` \| `"bassinet"` \| `"bassoon"` \| `"bathing cap, swimming cap"` \| `"bath towel"` \| `"bathtub, bathing tub, bath, tub"` \| `"beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon"` \| `"beacon, lighthouse, beacon light, pharos"` \| `"beaker"` \| `"bearskin, busby, shako"` \| `"beer bottle"` \| `"beer glass"` \| `"bell cote, bell cot"` \| `"bib"` \| `"bicycle-built-for-two, tandem bicycle, tandem"` \| `"bikini, two-piece"` \| `"binder, ring-binder"` \| `"binoculars, field glasses, opera glasses"` \| `"birdhouse"` \| `"boathouse"` \| `"bobsled, bobsleigh, bob"` \| `"bolo tie, bolo, bola tie, bola"` \| `"bonnet, poke bonnet"` \| `"bookcase"` \| `"bookshop, bookstore, bookstall"` \| `"bottlecap"` \| `"bow"` \| `"bow tie, bow-tie, bowtie"` \| `"brass, memorial tablet, plaque"` \| `"brassiere, bra, bandeau"` \| `"breakwater, groin, groyne, mole, bulwark, seawall, jetty"` \| `"breastplate, aegis, egis"` \| `"broom"` \| `"bucket, pail"` \| `"buckle"` \| `"bulletproof vest"` \| `"bullet train, bullet"` \| `"butcher shop, meat market"` \| `"cab, hack, taxi, taxicab"` \| `"caldron, cauldron"` \| `"candle, taper, wax light"` \| `"cannon"` \| `"canoe"` \| `"can opener, tin opener"` \| `"cardigan"` \| `"car mirror"` \| `"carousel, carrousel, merry-go-round, roundabout, whirligig"` \| `"carpenter's kit, tool kit"` \| `"carton"` \| `"car wheel"` \| `"cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM"` \| `"cassette"` \| `"cassette player"` \| `"castle"` \| `"catamaran"` \| `"CD player"` \| `"cello, violoncello"` \| `"cellular telephone, cellular phone, cellphone, cell, mobile phone"` \| `"chain"` \| `"chainlink fence"` \| `"chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour"` \| `"chain saw, chainsaw"` \| `"chest"` \| `"chiffonier, commode"` \| `"chime, bell, gong"` \| `"china cabinet, china closet"` \| `"Christmas stocking"` \| `"church, church building"` \| `"cinema, movie theater, movie theatre, movie house, picture palace"` \| `"cleaver, meat cleaver, chopper"` \| `"cliff dwelling"` \| `"cloak"` \| `"clog, geta, patten, sabot"` \| `"cocktail shaker"` \| `"coffee mug"` \| `"coffeepot"` \| `"coil, spiral, volute, whorl, helix"` \| `"combination lock"` \| `"computer keyboard, keypad"` \| `"confectionery, confectionery store, candy store"` \| `"container ship, containership, container vessel"` \| `"convertible"` \| `"corkscrew, bottle screw"` \| `"cornet, horn, trumpet, trump"` \| `"cowboy boot"` \| `"cowboy hat, ten-gallon hat"` \| `"cradle"` \| `"crash helmet"` \| `"crate"` \| `"crib, cot"` \| `"Crock Pot"` \| `"croquet ball"` \| `"crutch"` \| `"cuirass"` \| `"dam, dike, dyke"` \| `"desk"` \| `"desktop computer"` \| `"dial telephone, dial phone"` \| `"diaper, nappy, napkin"` \| `"digital clock"` \| `"digital watch"` \| `"dining table, board"` \| `"dishrag, dishcloth"` \| `"dishwasher, dish washer, dishwashing machine"` \| `"disk brake, disc brake"` \| `"dock, dockage, docking facility"` \| `"dogsled, dog sled, dog sleigh"` \| `"dome"` \| `"doormat, welcome mat"` \| `"drilling platform, offshore rig"` \| `"drum, membranophone, tympan"` \| `"drumstick"` \| `"dumbbell"` \| `"Dutch oven"` \| `"electric fan, blower"` \| `"electric guitar"` \| `"electric locomotive"` \| `"entertainment center"` \| `"envelope"` \| `"espresso maker"` \| `"face powder"` \| `"feather boa, boa"` \| `"file, file cabinet, filing cabinet"` \| `"fireboat"` \| `"fire engine, fire truck"` \| `"fire screen, fireguard"` \| `"flagpole, flagstaff"` \| `"flute, transverse flute"` \| `"folding chair"` \| `"football helmet"` \| `"forklift"` \| `"fountain"` \| `"fountain pen"` \| `"four-poster"` \| `"freight car"` \| `"French horn, horn"` \| `"frying pan, frypan, skillet"` \| `"fur coat"` \| `"garbage truck, dustcart"` \| `"gasmask, respirator, gas helmet"` \| `"gas pump, gasoline pump, petrol pump, island dispenser"` \| `"goblet"` \| `"go-kart"` \| `"golf ball"` \| `"golfcart, golf cart"` \| `"gondola"` \| `"gong, tam-tam"` \| `"gown"` \| `"grand piano, grand"` \| `"greenhouse, nursery, glasshouse"` \| `"grille, radiator grille"` \| `"grocery store, grocery, food market, market"` \| `"guillotine"` \| `"hair slide"` \| `"hair spray"` \| `"half track"` \| `"hammer"` \| `"hamper"` \| `"hand blower, blow dryer, blow drier, hair dryer, hair drier"` \| `"hand-held computer, hand-held microcomputer"` \| `"handkerchief, hankie, hanky, hankey"` \| `"hard disc, hard disk, fixed disk"` \| `"harmonica, mouth organ, harp, mouth harp"` \| `"harp"` \| `"harvester, reaper"` \| `"hatchet"` \| `"holster"` \| `"home theater, home theatre"` \| `"honeycomb"` \| `"hook, claw"` \| `"hoopskirt, crinoline"` \| `"horizontal bar, high bar"` \| `"horse cart, horse-cart"` \| `"hourglass"` \| `"iPod"` \| `"iron, smoothing iron"` \| `"jack-o'-lantern"` \| `"jean, blue jean, denim"` \| `"jeep, landrover"` \| `"jersey, T-shirt, tee shirt"` \| `"jigsaw puzzle"` \| `"jinrikisha, ricksha, rickshaw"` \| `"joystick"` \| `"kimono"` \| `"knee pad"` \| `"knot"` \| `"lab coat, laboratory coat"` \| `"ladle"` \| `"lampshade, lamp shade"` \| `"laptop, laptop computer"` \| `"lawn mower, mower"` \| `"lens cap, lens cover"` \| `"letter opener, paper knife, paperknife"` \| `"library"` \| `"lifeboat"` \| `"lighter, light, igniter, ignitor"` \| `"limousine, limo"` \| `"liner, ocean liner"` \| `"lipstick, lip rouge"` \| `"Loafer"` \| `"lotion"` \| `"loudspeaker, speaker, speaker unit, loudspeaker system, speaker system"` \| `"loupe, jeweler's loupe"` \| `"lumbermill, sawmill"` \| `"magnetic compass"` \| `"mailbag, postbag"` \| `"mailbox, letter box"` \| `"maillot"` \| `"maillot, tank suit"` \| `"manhole cover"` \| `"maraca"` \| `"marimba, xylophone"` \| `"mask"` \| `"matchstick"` \| `"maypole"` \| `"maze, labyrinth"` \| `"measuring cup"` \| `"medicine chest, medicine cabinet"` \| `"megalith, megalithic structure"` \| `"microphone, mike"` \| `"microwave, microwave oven"` \| `"military uniform"` \| `"milk can"` \| `"minibus"` \| `"miniskirt, mini"` \| `"minivan"` \| `"missile"` \| `"mitten"` \| `"mixing bowl"` \| `"mobile home, manufactured home"` \| `"Model T"` \| `"modem"` \| `"monastery"` \| `"monitor"` \| `"moped"` \| `"mortar"` \| `"mortarboard"` \| `"mosque"` \| `"mosquito net"` \| `"motor scooter, scooter"` \| `"mountain bike, all-terrain bike, off-roader"` \| `"mountain tent"` \| `"mouse, computer mouse"` \| `"mousetrap"` \| `"moving van"` \| `"muzzle"` \| `"nail"` \| `"neck brace"` \| `"necklace"` \| `"nipple"` \| `"notebook, notebook computer"` \| `"obelisk"` \| `"oboe, hautboy, hautbois"` \| `"ocarina, sweet potato"` \| `"odometer, hodometer, mileometer, milometer"` \| `"oil filter"` \| `"organ, pipe organ"` \| `"oscilloscope, scope, cathode-ray oscilloscope, CRO"` \| `"overskirt"` \| `"oxcart"` \| `"oxygen mask"` \| `"packet"` \| `"paddle, boat paddle"` \| `"paddlewheel, paddle wheel"` \| `"padlock"` \| `"paintbrush"` \| `"pajama, pyjama, pj's, jammies"` \| `"palace"` \| `"panpipe, pandean pipe, syrinx"` \| `"paper towel"` \| `"parachute, chute"` \| `"parallel bars, bars"` \| `"park bench"` \| `"parking meter"` \| `"passenger car, coach, carriage"` \| `"patio, terrace"` \| `"pay-phone, pay-station"` \| `"pedestal, plinth, footstall"` \| `"pencil box, pencil case"` \| `"pencil sharpener"` \| `"perfume, essence"` \| `"Petri dish"` \| `"photocopier"` \| `"pick, plectrum, plectron"` \| `"pickelhaube"` \| `"picket fence, paling"` \| `"pickup, pickup truck"` \| `"pier"` \| `"piggy bank, penny bank"` \| `"pill bottle"` \| `"pillow"` \| `"ping-pong ball"` \| `"pinwheel"` \| `"pirate, pirate ship"` \| `"pitcher, ewer"` \| `"plane, carpenter's plane, woodworking plane"` \| `"planetarium"` \| `"plastic bag"` \| `"plate rack"` \| `"plow, plough"` \| `"plunger, plumber's helper"` \| `"Polaroid camera, Polaroid Land camera"` \| `"pole"` \| `"police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria"` \| `"poncho"` \| `"pool table, billiard table, snooker table"` \| `"pop bottle, soda bottle"` \| `"pot, flowerpot"` \| `"potter's wheel"` \| `"power drill"` \| `"prayer rug, prayer mat"` \| `"printer"` \| `"prison, prison house"` \| `"projectile, missile"` \| `"projector"` \| `"puck, hockey puck"` \| `"punching bag, punch bag, punching ball, punchball"` \| `"purse"` \| `"quill, quill pen"` \| `"quilt, comforter, comfort, puff"` \| `"racer, race car, racing car"` \| `"racket, racquet"` \| `"radiator"` \| `"radio, wireless"` \| `"radio telescope, radio reflector"` \| `"rain barrel"` \| `"recreational vehicle, RV, R.V."` \| `"reel"` \| `"reflex camera"` \| `"refrigerator, icebox"` \| `"remote control, remote"` \| `"restaurant, eating house, eating place, eatery"` \| `"revolver, six-gun, six-shooter"` \| `"rifle"` \| `"rocking chair, rocker"` \| `"rotisserie"` \| `"rubber eraser, rubber, pencil eraser"` \| `"rugby ball"` \| `"rule, ruler"` \| `"running shoe"` \| `"safe"` \| `"safety pin"` \| `"saltshaker, salt shaker"` \| `"sandal"` \| `"sarong"` \| `"sax, saxophone"` \| `"scabbard"` \| `"scale, weighing machine"` \| `"school bus"` \| `"schooner"` \| `"scoreboard"` \| `"screen, CRT screen"` \| `"screw"` \| `"screwdriver"` \| `"seat belt, seatbelt"` \| `"sewing machine"` \| `"shield, buckler"` \| `"shoe shop, shoe-shop, shoe store"` \| `"shoji"` \| `"shopping basket"` \| `"shopping cart"` \| `"shovel"` \| `"shower cap"` \| `"shower curtain"` \| `"ski"` \| `"ski mask"` \| `"sleeping bag"` \| `"slide rule, slipstick"` \| `"sliding door"` \| `"slot, one-armed bandit"` \| `"snorkel"` \| `"snowmobile"` \| `"snowplow, snowplough"` \| `"soap dispenser"` \| `"soccer ball"` \| `"sock"` \| `"solar dish, solar collector, solar furnace"` \| `"sombrero"` \| `"soup bowl"` \| `"space bar"` \| `"space heater"` \| `"space shuttle"` \| `"spatula"` \| `"speedboat"` \| `"spider web, spider's web"` \| `"spindle"` \| `"sports car, sport car"` \| `"spotlight, spot"` \| `"stage"` \| `"steam locomotive"` \| `"steel arch bridge"` \| `"steel drum"` \| `"stethoscope"` \| `"stole"` \| `"stone wall"` \| `"stopwatch, stop watch"` \| `"stove"` \| `"strainer"` \| `"streetcar, tram, tramcar, trolley, trolley car"` \| `"stretcher"` \| `"studio couch, day bed"` \| `"stupa, tope"` \| `"submarine, pigboat, sub, U-boat"` \| `"suit, suit of clothes"` \| `"sundial"` \| `"sunglass"` \| `"sunglasses, dark glasses, shades"` \| `"sunscreen, sunblock, sun blocker"` \| `"suspension bridge"` \| `"swab, swob, mop"` \| `"sweatshirt"` \| `"swimming trunks, bathing trunks"` \| `"swing"` \| `"switch, electric switch, electrical switch"` \| `"syringe"` \| `"table lamp"` \| `"tank, army tank, armored combat vehicle, armoured combat vehicle"` \| `"tape player"` \| `"teapot"` \| `"teddy, teddy bear"` \| `"television, television system"` \| `"tennis ball"` \| `"thatch, thatched roof"` \| `"theater curtain, theatre curtain"` \| `"thimble"` \| `"thresher, thrasher, threshing machine"` \| `"throne"` \| `"tile roof"` \| `"toaster"` \| `"tobacco shop, tobacconist shop, tobacconist"` \| `"toilet seat"` \| `"torch"` \| `"totem pole"` \| `"tow truck, tow car, wrecker"` \| `"toyshop"` \| `"tractor"` \| `"trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi"` \| `"tray"` \| `"trench coat"` \| `"tricycle, trike, velocipede"` \| `"trimaran"` \| `"tripod"` \| `"triumphal arch"` \| `"trolleybus, trolley coach, trackless trolley"` \| `"trombone"` \| `"tub, vat"` \| `"turnstile"` \| `"typewriter keyboard"` \| `"umbrella"` \| `"unicycle, monocycle"` \| `"upright, upright piano"` \| `"vacuum, vacuum cleaner"` \| `"vase"` \| `"vault"` \| `"velvet"` \| `"vending machine"` \| `"vestment"` \| `"viaduct"` \| `"violin, fiddle"` \| `"volleyball"` \| `"waffle iron"` \| `"wall clock"` \| `"wallet, billfold, notecase, pocketbook"` \| `"wardrobe, closet, press"` \| `"warplane, military plane"` \| `"washbasin, handbasin, washbowl, lavabo, wash-hand basin"` \| `"washer, automatic washer, washing machine"` \| `"water bottle"` \| `"water jug"` \| `"water tower"` \| `"whiskey jug"` \| `"whistle"` \| `"wig"` \| `"window screen"` \| `"window shade"` \| `"Windsor tie"` \| `"wine bottle"` \| `"wing"` \| `"wok"` \| `"wooden spoon"` \| `"wool, woolen, woollen"` \| `"worm fence, snake fence, snake-rail fence, Virginia fence"` \| `"wreck"` \| `"yawl"` \| `"yurt"` \| `"web site, website, internet site, site"` \| `"comic book"` \| `"crossword puzzle, crossword"` \| `"street sign"` \| `"traffic light, traffic signal, stoplight"` \| `"book jacket, dust cover, dust jacket, dust wrapper"` \| `"menu"` \| `"plate"` \| `"guacamole"` \| `"consomme"` \| `"hot pot, hotpot"` \| `"trifle"` \| `"ice cream, icecream"` \| `"ice lolly, lolly, lollipop, popsicle"` \| `"French loaf"` \| `"bagel, beigel"` \| `"pretzel"` \| `"cheeseburger"` \| `"hotdog, hot dog, red hot"` \| `"mashed potato"` \| `"head cabbage"` \| `"broccoli"` \| `"cauliflower"` \| `"zucchini, courgette"` \| `"spaghetti squash"` \| `"acorn squash"` \| `"butternut squash"` \| `"cucumber, cuke"` \| `"artichoke, globe artichoke"` \| `"bell pepper"` \| `"cardoon"` \| `"mushroom"` \| `"Granny Smith"` \| `"strawberry"` \| `"orange"` \| `"lemon"` \| `"fig"` \| `"pineapple, ananas"` \| `"banana"` \| `"jackfruit, jak, jack"` \| `"custard apple"` \| `"pomegranate"` \| `"hay"` \| `"carbonara"` \| `"chocolate sauce, chocolate syrup"` \| `"dough"` \| `"meat loaf, meatloaf"` \| `"pizza, pizza pie"` \| `"potpie"` \| `"burrito"` \| `"red wine"` \| `"espresso"` \| `"cup"` \| `"eggnog"` \| `"alp"` \| `"bubble"` \| `"cliff, drop, drop-off"` \| `"coral reef"` \| `"geyser"` \| `"lakeside, lakeside road, lakeshore"` \| `"promontory, headland, head, foreland"` \| `"sandbar, sand bar"` \| `"seashore, coast, seacoast, sea-coast"` \| `"valley, vale"` \| `"volcano"` \| `"ballplayer, baseball player"` \| `"groom, bridegroom"` \| `"scuba diver"` \| `"rapeseed"` \| `"daisy"` \| `"yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum"` \| `"corn"` \| `"acorn"` \| `"hip, rose hip, rosehip"` \| `"buckeye, horse chestnut, conker"` \| `"coral fungus"` \| `"agaric"` \| `"gyromitra"` \| `"stinkhorn, carrion fungus"` \| `"earthstar"` \| `"hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa"` \| `"bolete"` \| `"ear, spike, capitulum"` \| `"toilet tissue, toilet paper, bathroom tissue"`\> = `EFFICIENTNET_V2_S_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`"tench, Tinca tinca"` \| `"goldfish, Carassius auratus"` \| `"great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias"` \| `"tiger shark, Galeocerdo cuvieri"` \| `"hammerhead, hammerhead shark"` \| `"electric ray, crampfish, numbfish, torpedo"` \| `"stingray"` \| `"cock"` \| `"hen"` \| `"ostrich, Struthio camelus"` \| `"brambling, Fringilla montifringilla"` \| `"goldfinch, Carduelis carduelis"` \| `"house finch, linnet, Carpodacus mexicanus"` \| `"junco, snowbird"` \| `"indigo bunting, indigo finch, indigo bird, Passerina cyanea"` \| `"robin, American robin, Turdus migratorius"` \| `"bulbul"` \| `"jay"` \| `"magpie"` \| `"chickadee"` \| `"water ouzel, dipper"` \| `"kite"` \| `"bald eagle, American eagle, Haliaeetus leucocephalus"` \| `"vulture"` \| `"great grey owl, great gray owl, Strix nebulosa"` \| `"European fire salamander, Salamandra salamandra"` \| `"common newt, Triturus vulgaris"` \| `"eft"` \| `"spotted salamander, Ambystoma maculatum"` \| `"axolotl, mud puppy, Ambystoma mexicanum"` \| `"bullfrog, Rana catesbeiana"` \| `"tree frog, tree-frog"` \| `"tailed frog, bell toad, ribbed toad, tailed toad, Ascaphus trui"` \| `"loggerhead, loggerhead turtle, Caretta caretta"` \| `"leatherback turtle, leatherback, leathery turtle, Dermochelys coriacea"` \| `"mud turtle"` \| `"terrapin"` \| `"box turtle, box tortoise"` \| `"banded gecko"` \| `"common iguana, iguana, Iguana iguana"` \| `"American chameleon, anole, Anolis carolenensis"` \| `"whiptail, whiptail lizard"` \| `"agama"` \| `"frilled lizard, Chlamydosaurus kingi"` \| `"alligator lizard"` \| `"Gila monster, Heloderma suspectum"` \| `"green lizard, Lacerta viridis"` \| `"African chameleon, Chamaeleo chamaeleon"` \| `"Komodo dragon, Komodo lizard, dragon lizard, giant lizard, Varanus komodoensis"` \| `"African crocodile, Nile crocodile, Crocodylus niloticus"` \| `"American alligator, Alligator mississipiensis"` \| `"triceratops"` \| `"thunder snake, worm snake, Carphophis amoenus"` \| `"ringneck snake, ring-necked snake, ring snake"` \| `"hognose snake, puff adder, sand viper"` \| `"green snake, grass snake"` \| `"king snake, kingsnake"` \| `"garter snake, grass snake"` \| `"water snake"` \| `"vine snake"` \| `"night snake, Hypsiglena torquata"` \| `"boa constrictor, Constrictor constrictor"` \| `"rock python, rock snake, Python sebae"` \| `"Indian cobra, Naja naja"` \| `"green mamba"` \| `"sea snake"` \| `"horned viper, cerastes, sand viper, horned asp, Cerastes cornutus"` \| `"diamondback, diamondback rattlesnake, Crotalus adamanteus"` \| `"sidewinder, horned rattlesnake, Crotalus cerastes"` \| `"trilobite"` \| `"harvestman, daddy longlegs, Phalangium opilio"` \| `"scorpion"` \| `"black and gold garden spider, Argiope aurantia"` \| `"barn spider, Araneus cavaticus"` \| `"garden spider, Aranea diademata"` \| `"black widow, Latrodectus mactans"` \| `"tarantula"` \| `"wolf spider, hunting spider"` \| `"tick"` \| `"centipede"` \| `"black grouse"` \| `"ptarmigan"` \| `"ruffed grouse, partridge, Bonasa umbellus"` \| `"prairie chicken, prairie grouse, prairie fowl"` \| `"peacock"` \| `"quail"` \| `"partridge"` \| `"African grey, African gray, Psittacus erithacus"` \| `"macaw"` \| `"sulphur-crested cockatoo, Kakatoe galerita, Cacatua galerita"` \| `"lorikeet"` \| `"coucal"` \| `"bee eater"` \| `"hornbill"` \| `"hummingbird"` \| `"jacamar"` \| `"toucan"` \| `"drake"` \| `"red-breasted merganser, Mergus serrator"` \| `"goose"` \| `"black swan, Cygnus atratus"` \| `"tusker"` \| `"echidna, spiny anteater, anteater"` \| `"platypus, duckbill, duckbilled platypus, duck-billed platypus, Ornithorhynchus anatinus"` \| `"wallaby, brush kangaroo"` \| `"koala, koala bear, kangaroo bear, native bear, Phascolarctos cinereus"` \| `"wombat"` \| `"jellyfish"` \| `"sea anemone, anemone"` \| `"brain coral"` \| `"flatworm, platyhelminth"` \| `"nematode, nematode worm, roundworm"` \| `"conch"` \| `"snail"` \| `"slug"` \| `"sea slug, nudibranch"` \| `"chiton, coat-of-mail shell, sea cradle, polyplacophore"` \| `"chambered nautilus, pearly nautilus, nautilus"` \| `"Dungeness crab, Cancer magister"` \| `"rock crab, Cancer irroratus"` \| `"fiddler crab"` \| `"king crab, Alaska crab, Alaskan king crab, Alaska king crab, Paralithodes camtschatica"` \| `"American lobster, Northern lobster, Maine lobster, Homarus americanus"` \| `"spiny lobster, langouste, rock lobster, crawfish, crayfish, sea crawfish"` \| `"crayfish, crawfish, crawdad, crawdaddy"` \| `"hermit crab"` \| `"isopod"` \| `"white stork, Ciconia ciconia"` \| `"black stork, Ciconia nigra"` \| `"spoonbill"` \| `"flamingo"` \| `"little blue heron, Egretta caerulea"` \| `"American egret, great white heron, Egretta albus"` \| `"bittern"` \| `"crane"` \| `"limpkin, Aramus pictus"` \| `"European gallinule, Porphyrio porphyrio"` \| `"American coot, marsh hen, mud hen, water hen, Fulica americana"` \| `"bustard"` \| `"ruddy turnstone, Arenaria interpres"` \| `"red-backed sandpiper, dunlin, Erolia alpina"` \| `"redshank, Tringa totanus"` \| `"dowitcher"` \| `"oystercatcher, oyster catcher"` \| `"pelican"` \| `"king penguin, Aptenodytes patagonica"` \| `"albatross, mollymawk"` \| `"grey whale, gray whale, devilfish, Eschrichtius gibbosus, Eschrichtius robustus"` \| `"killer whale, killer, orca, grampus, sea wolf, Orcinus orca"` \| `"dugong, Dugong dugon"` \| `"sea lion"` \| `"Chihuahua"` \| `"Japanese spaniel"` \| `"Maltese dog, Maltese terrier, Maltese"` \| `"Pekinese, Pekingese, Peke"` \| `"Shih-Tzu"` \| `"Blenheim spaniel"` \| `"papillon"` \| `"toy terrier"` \| `"Rhodesian ridgeback"` \| `"Afghan hound, Afghan"` \| `"basset, basset hound"` \| `"beagle"` \| `"bloodhound, sleuthhound"` \| `"bluetick"` \| `"black-and-tan coonhound"` \| `"Walker hound, Walker foxhound"` \| `"English foxhound"` \| `"redbone"` \| `"borzoi, Russian wolfhound"` \| `"Irish wolfhound"` \| `"Italian greyhound"` \| `"whippet"` \| `"Ibizan hound, Ibizan Podenco"` \| `"Norwegian elkhound, elkhound"` \| `"otterhound, otter hound"` \| `"Saluki, gazelle hound"` \| `"Scottish deerhound, deerhound"` \| `"Weimaraner"` \| `"Staffordshire bullterrier, Staffordshire bull terrier"` \| `"American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier"` \| `"Bedlington terrier"` \| `"Border terrier"` \| `"Kerry blue terrier"` \| `"Irish terrier"` \| `"Norfolk terrier"` \| `"Norwich terrier"` \| `"Yorkshire terrier"` \| `"wire-haired fox terrier"` \| `"Lakeland terrier"` \| `"Sealyham terrier, Sealyham"` \| `"Airedale, Airedale terrier"` \| `"cairn, cairn terrier"` \| `"Australian terrier"` \| `"Dandie Dinmont, Dandie Dinmont terrier"` \| `"Boston bull, Boston terrier"` \| `"miniature schnauzer"` \| `"giant schnauzer"` \| `"standard schnauzer"` \| `"Scotch terrier, Scottish terrier, Scottie"` \| `"Tibetan terrier, chrysanthemum dog"` \| `"silky terrier, Sydney silky"` \| `"soft-coated wheaten terrier"` \| `"West Highland white terrier"` \| `"Lhasa, Lhasa apso"` \| `"flat-coated retriever"` \| `"curly-coated retriever"` \| `"golden retriever"` \| `"Labrador retriever"` \| `"Chesapeake Bay retriever"` \| `"German short-haired pointer"` \| `"vizsla, Hungarian pointer"` \| `"English setter"` \| `"Irish setter, red setter"` \| `"Gordon setter"` \| `"Brittany spaniel"` \| `"clumber, clumber spaniel"` \| `"English springer, English springer spaniel"` \| `"Welsh springer spaniel"` \| `"cocker spaniel, English cocker spaniel, cocker"` \| `"Sussex spaniel"` \| `"Irish water spaniel"` \| `"kuvasz"` \| `"schipperke"` \| `"groenendael"` \| `"malinois"` \| `"briard"` \| `"kelpie"` \| `"komondor"` \| `"Old English sheepdog, bobtail"` \| `"Shetland sheepdog, Shetland sheep dog, Shetland"` \| `"collie"` \| `"Border collie"` \| `"Bouvier des Flandres, Bouviers des Flandres"` \| `"Rottweiler"` \| `"German shepherd, German shepherd dog, German police dog, alsatian"` \| `"Doberman, Doberman pinscher"` \| `"miniature pinscher"` \| `"Greater Swiss Mountain dog"` \| `"Bernese mountain dog"` \| `"Appenzeller"` \| `"EntleBucher"` \| `"boxer"` \| `"bull mastiff"` \| `"Tibetan mastiff"` \| `"French bulldog"` \| `"Great Dane"` \| `"Saint Bernard, St Bernard"` \| `"Eskimo dog, husky"` \| `"malamute, malemute, Alaskan malamute"` \| `"Siberian husky"` \| `"dalmatian, coach dog, carriage dog"` \| `"affenpinscher, monkey pinscher, monkey dog"` \| `"basenji"` \| `"pug, pug-dog"` \| `"Leonberg"` \| `"Newfoundland, Newfoundland dog"` \| `"Great Pyrenees"` \| `"Samoyed, Samoyede"` \| `"Pomeranian"` \| `"chow, chow chow"` \| `"keeshond"` \| `"Brabancon griffon"` \| `"Pembroke, Pembroke Welsh corgi"` \| `"Cardigan, Cardigan Welsh corgi"` \| `"toy poodle"` \| `"miniature poodle"` \| `"standard poodle"` \| `"Mexican hairless"` \| `"timber wolf, grey wolf, gray wolf, Canis lupus"` \| `"white wolf, Arctic wolf, Canis lupus tundrarum"` \| `"red wolf, maned wolf, Canis rufus, Canis niger"` \| `"coyote, prairie wolf, brush wolf, Canis latrans"` \| `"dingo, warrigal, warragal, Canis dingo"` \| `"dhole, Cuon alpinus"` \| `"African hunting dog, hyena dog, Cape hunting dog, Lycaon pictus"` \| `"hyena, hyaena"` \| `"red fox, Vulpes vulpes"` \| `"kit fox, Vulpes macrotis"` \| `"Arctic fox, white fox, Alopex lagopus"` \| `"grey fox, gray fox, Urocyon cinereoargenteus"` \| `"tabby, tabby cat"` \| `"tiger cat"` \| `"Persian cat"` \| `"Siamese cat, Siamese"` \| `"Egyptian cat"` \| `"cougar, puma, catamount, mountain lion, painter, panther, Felis concolor"` \| `"lynx, catamount"` \| `"leopard, Panthera pardus"` \| `"snow leopard, ounce, Panthera uncia"` \| `"jaguar, panther, Panthera onca, Felis onca"` \| `"lion, king of beasts, Panthera leo"` \| `"tiger, Panthera tigris"` \| `"cheetah, chetah, Acinonyx jubatus"` \| `"brown bear, bruin, Ursus arctos"` \| `"American black bear, black bear, Ursus americanus, Euarctos americanus"` \| `"ice bear, polar bear, Ursus Maritimus, Thalarctos maritimus"` \| `"sloth bear, Melursus ursinus, Ursus ursinus"` \| `"mongoose"` \| `"meerkat, mierkat"` \| `"tiger beetle"` \| `"ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle"` \| `"ground beetle, carabid beetle"` \| `"long-horned beetle, longicorn, longicorn beetle"` \| `"leaf beetle, chrysomelid"` \| `"dung beetle"` \| `"rhinoceros beetle"` \| `"weevil"` \| `"fly"` \| `"bee"` \| `"ant, emmet, pismire"` \| `"grasshopper, hopper"` \| `"cricket"` \| `"walking stick, walkingstick, stick insect"` \| `"cockroach, roach"` \| `"focused mantis, mantid"` \| `"cicada, cicala"` \| `"leafhopper"` \| `"lacewing, lacewing fly"` \| `"dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk"` \| `"damselfly"` \| `"admiral"` \| `"ringlet, ringlet butterfly"` \| `"monarch, monarch butterfly, milkweed butterfly, Danaus plexippus"` \| `"cabbage butterfly"` \| `"sulphur butterfly, sulfur butterfly"` \| `"lycaenid, lycaenid butterfly"` \| `"starfish, sea star"` \| `"sea urchin"` \| `"sea cucumber, holothurian"` \| `"wood rabbit, cottontail, cottontail rabbit"` \| `"hare"` \| `"Angora, Angora rabbit"` \| `"hamster"` \| `"porcupine, hedgehog"` \| `"fox squirrel, eastern fox squirrel, Sciurus niger"` \| `"marmot"` \| `"beaver"` \| `"guinea pig, Cavia cobaya"` \| `"sorrel"` \| `"zebra"` \| `"hog, pig, grunter, squealer, Sus scrofa"` \| `"wild boar, boar, Sus scrofa"` \| `"warthog"` \| `"hippopotamus, hippo, river horse, Hippopotamus amphibius"` \| `"ox"` \| `"water buffalo, water ox, Asiatic buffalo, Bubalus bubalis"` \| `"bison"` \| `"ram, tup"` \| `"bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis"` \| `"ibex, Capra ibex"` \| `"hartebeest"` \| `"impala, Aepyceros melampus"` \| `"gazelle"` \| `"Arabian camel, dromedary, Camelus dromedarius"` \| `"llama"` \| `"weasel"` \| `"mink"` \| `"polecat, fitch, foulmart, foumart, Mustela putorius"` \| `"black-footed ferret, ferret, Mustela nigripes"` \| `"otter"` \| `"skunk, polecat, wood pussy"` \| `"badger"` \| `"armadillo"` \| `"three-toed sloth, ai, Bradypus tridactylus"` \| `"orangutan, orang, orangutang, Pongo pygmaeus"` \| `"gorilla, Gorilla gorilla"` \| `"chimpanzee, chimp, Pan troglodytes"` \| `"gibbon, Hylobates lar"` \| `"siamang, Hylobates syndactylus, Symphalangus syndactylus"` \| `"guenon, guenon monkey"` \| `"patas, hussar monkey, Erythrocebus patas"` \| `"baboon"` \| `"macaque"` \| `"langur"` \| `"colobus, colobus monkey"` \| `"proboscis monkey, Nasalis larvatus"` \| `"marmoset"` \| `"capuchin, ringtail, Cebus capucinus"` \| `"howler monkey, howler"` \| `"titi, titi monkey"` \| `"spider monkey, Ateles geoffroyi"` \| `"squirrel monkey, Saimiri sciureus"` \| `"Madagascar cat, ring-tailed lemur, Lemur catta"` \| `"indri, indris, Indri indri, Indri brevicaudatus"` \| `"Indian elephant, Elephas maximus"` \| `"African elephant, Loxodonta africana"` \| `"lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens"` \| `"giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca"` \| `"barracouta, snoek"` \| `"raw eel, eel"` \| `"coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch"` \| `"rock beauty, Holocanthus tricolor"` \| `"anemone fish"` \| `"sturgeon"` \| `"gar, garfish, garpike, billfish, Lepisosteus osseus"` \| `"lionfish"` \| `"puffer, pufferfish, blowfish, globefish"` \| `"abacus"` \| `"abaya"` \| `"academic gown, academic robe, judge's robe"` \| `"accordion, piano accordion, squeeze box"` \| `"acoustic guitar"` \| `"aircraft carrier, carrier, flattop, attack aircraft carrier"` \| `"airliner"` \| `"airship, dirigible"` \| `"altar"` \| `"ambulance"` \| `"amphibian, amphibious vehicle"` \| `"analog clock"` \| `"apiary, bee house"` \| `"apron"` \| `"ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin"` \| `"assault rifle, assault gun"` \| `"backpack, back pack, knapsack, packsack, rucksack, haversack"` \| `"bakery, bakeshop, bakehouse"` \| `"balance beam, beam"` \| `"balloon"` \| `"ballpoint, ballpoint pen, ballpen, Biro"` \| `"Band Aid"` \| `"banjo"` \| `"bannister, banister, balustrade, balusters, handrail"` \| `"barbell"` \| `"barber chair"` \| `"barbershop"` \| `"barn"` \| `"barometer"` \| `"barrel, cask"` \| `"barrow, garden cart, lawn cart, wheelbarrow"` \| `"baseball"` \| `"basketball"` \| `"bassinet"` \| `"bassoon"` \| `"bathing cap, swimming cap"` \| `"bath towel"` \| `"bathtub, bathing tub, bath, tub"` \| `"beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon"` \| `"beacon, lighthouse, beacon light, pharos"` \| `"beaker"` \| `"bearskin, busby, shako"` \| `"beer bottle"` \| `"beer glass"` \| `"bell cote, bell cot"` \| `"bib"` \| `"bicycle-built-for-two, tandem bicycle, tandem"` \| `"bikini, two-piece"` \| `"binder, ring-binder"` \| `"binoculars, field glasses, opera glasses"` \| `"birdhouse"` \| `"boathouse"` \| `"bobsled, bobsleigh, bob"` \| `"bolo tie, bolo, bola tie, bola"` \| `"bonnet, poke bonnet"` \| `"bookcase"` \| `"bookshop, bookstore, bookstall"` \| `"bottlecap"` \| `"bow"` \| `"bow tie, bow-tie, bowtie"` \| `"brass, memorial tablet, plaque"` \| `"brassiere, bra, bandeau"` \| `"breakwater, groin, groyne, mole, bulwark, seawall, jetty"` \| `"breastplate, aegis, egis"` \| `"broom"` \| `"bucket, pail"` \| `"buckle"` \| `"bulletproof vest"` \| `"bullet train, bullet"` \| `"butcher shop, meat market"` \| `"cab, hack, taxi, taxicab"` \| `"caldron, cauldron"` \| `"candle, taper, wax light"` \| `"cannon"` \| `"canoe"` \| `"can opener, tin opener"` \| `"cardigan"` \| `"car mirror"` \| `"carousel, carrousel, merry-go-round, roundabout, whirligig"` \| `"carpenter's kit, tool kit"` \| `"carton"` \| `"car wheel"` \| `"cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM"` \| `"cassette"` \| `"cassette player"` \| `"castle"` \| `"catamaran"` \| `"CD player"` \| `"cello, violoncello"` \| `"cellular telephone, cellular phone, cellphone, cell, mobile phone"` \| `"chain"` \| `"chainlink fence"` \| `"chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour"` \| `"chain saw, chainsaw"` \| `"chest"` \| `"chiffonier, commode"` \| `"chime, bell, gong"` \| `"china cabinet, china closet"` \| `"Christmas stocking"` \| `"church, church building"` \| `"cinema, movie theater, movie theatre, movie house, picture palace"` \| `"cleaver, meat cleaver, chopper"` \| `"cliff dwelling"` \| `"cloak"` \| `"clog, geta, patten, sabot"` \| `"cocktail shaker"` \| `"coffee mug"` \| `"coffeepot"` \| `"coil, spiral, volute, whorl, helix"` \| `"combination lock"` \| `"computer keyboard, keypad"` \| `"confectionery, confectionery store, candy store"` \| `"container ship, containership, container vessel"` \| `"convertible"` \| `"corkscrew, bottle screw"` \| `"cornet, horn, trumpet, trump"` \| `"cowboy boot"` \| `"cowboy hat, ten-gallon hat"` \| `"cradle"` \| `"crash helmet"` \| `"crate"` \| `"crib, cot"` \| `"Crock Pot"` \| `"croquet ball"` \| `"crutch"` \| `"cuirass"` \| `"dam, dike, dyke"` \| `"desk"` \| `"desktop computer"` \| `"dial telephone, dial phone"` \| `"diaper, nappy, napkin"` \| `"digital clock"` \| `"digital watch"` \| `"dining table, board"` \| `"dishrag, dishcloth"` \| `"dishwasher, dish washer, dishwashing machine"` \| `"disk brake, disc brake"` \| `"dock, dockage, docking facility"` \| `"dogsled, dog sled, dog sleigh"` \| `"dome"` \| `"doormat, welcome mat"` \| `"drilling platform, offshore rig"` \| `"drum, membranophone, tympan"` \| `"drumstick"` \| `"dumbbell"` \| `"Dutch oven"` \| `"electric fan, blower"` \| `"electric guitar"` \| `"electric locomotive"` \| `"entertainment center"` \| `"envelope"` \| `"espresso maker"` \| `"face powder"` \| `"feather boa, boa"` \| `"file, file cabinet, filing cabinet"` \| `"fireboat"` \| `"fire engine, fire truck"` \| `"fire screen, fireguard"` \| `"flagpole, flagstaff"` \| `"flute, transverse flute"` \| `"folding chair"` \| `"football helmet"` \| `"forklift"` \| `"fountain"` \| `"fountain pen"` \| `"four-poster"` \| `"freight car"` \| `"French horn, horn"` \| `"frying pan, frypan, skillet"` \| `"fur coat"` \| `"garbage truck, dustcart"` \| `"gasmask, respirator, gas helmet"` \| `"gas pump, gasoline pump, petrol pump, island dispenser"` \| `"goblet"` \| `"go-kart"` \| `"golf ball"` \| `"golfcart, golf cart"` \| `"gondola"` \| `"gong, tam-tam"` \| `"gown"` \| `"grand piano, grand"` \| `"greenhouse, nursery, glasshouse"` \| `"grille, radiator grille"` \| `"grocery store, grocery, food market, market"` \| `"guillotine"` \| `"hair slide"` \| `"hair spray"` \| `"half track"` \| `"hammer"` \| `"hamper"` \| `"hand blower, blow dryer, blow drier, hair dryer, hair drier"` \| `"hand-held computer, hand-held microcomputer"` \| `"handkerchief, hankie, hanky, hankey"` \| `"hard disc, hard disk, fixed disk"` \| `"harmonica, mouth organ, harp, mouth harp"` \| `"harp"` \| `"harvester, reaper"` \| `"hatchet"` \| `"holster"` \| `"home theater, home theatre"` \| `"honeycomb"` \| `"hook, claw"` \| `"hoopskirt, crinoline"` \| `"horizontal bar, high bar"` \| `"horse cart, horse-cart"` \| `"hourglass"` \| `"iPod"` \| `"iron, smoothing iron"` \| `"jack-o'-lantern"` \| `"jean, blue jean, denim"` \| `"jeep, landrover"` \| `"jersey, T-shirt, tee shirt"` \| `"jigsaw puzzle"` \| `"jinrikisha, ricksha, rickshaw"` \| `"joystick"` \| `"kimono"` \| `"knee pad"` \| `"knot"` \| `"lab coat, laboratory coat"` \| `"ladle"` \| `"lampshade, lamp shade"` \| `"laptop, laptop computer"` \| `"lawn mower, mower"` \| `"lens cap, lens cover"` \| `"letter opener, paper knife, paperknife"` \| `"library"` \| `"lifeboat"` \| `"lighter, light, igniter, ignitor"` \| `"limousine, limo"` \| `"liner, ocean liner"` \| `"lipstick, lip rouge"` \| `"Loafer"` \| `"lotion"` \| `"loudspeaker, speaker, speaker unit, loudspeaker system, speaker system"` \| `"loupe, jeweler's loupe"` \| `"lumbermill, sawmill"` \| `"magnetic compass"` \| `"mailbag, postbag"` \| `"mailbox, letter box"` \| `"maillot"` \| `"maillot, tank suit"` \| `"manhole cover"` \| `"maraca"` \| `"marimba, xylophone"` \| `"mask"` \| `"matchstick"` \| `"maypole"` \| `"maze, labyrinth"` \| `"measuring cup"` \| `"medicine chest, medicine cabinet"` \| `"megalith, megalithic structure"` \| `"microphone, mike"` \| `"microwave, microwave oven"` \| `"military uniform"` \| `"milk can"` \| `"minibus"` \| `"miniskirt, mini"` \| `"minivan"` \| `"missile"` \| `"mitten"` \| `"mixing bowl"` \| `"mobile home, manufactured home"` \| `"Model T"` \| `"modem"` \| `"monastery"` \| `"monitor"` \| `"moped"` \| `"mortar"` \| `"mortarboard"` \| `"mosque"` \| `"mosquito net"` \| `"motor scooter, scooter"` \| `"mountain bike, all-terrain bike, off-roader"` \| `"mountain tent"` \| `"mouse, computer mouse"` \| `"mousetrap"` \| `"moving van"` \| `"muzzle"` \| `"nail"` \| `"neck brace"` \| `"necklace"` \| `"nipple"` \| `"notebook, notebook computer"` \| `"obelisk"` \| `"oboe, hautboy, hautbois"` \| `"ocarina, sweet potato"` \| `"odometer, hodometer, mileometer, milometer"` \| `"oil filter"` \| `"organ, pipe organ"` \| `"oscilloscope, scope, cathode-ray oscilloscope, CRO"` \| `"overskirt"` \| `"oxcart"` \| `"oxygen mask"` \| `"packet"` \| `"paddle, boat paddle"` \| `"paddlewheel, paddle wheel"` \| `"padlock"` \| `"paintbrush"` \| `"pajama, pyjama, pj's, jammies"` \| `"palace"` \| `"panpipe, pandean pipe, syrinx"` \| `"paper towel"` \| `"parachute, chute"` \| `"parallel bars, bars"` \| `"park bench"` \| `"parking meter"` \| `"passenger car, coach, carriage"` \| `"patio, terrace"` \| `"pay-phone, pay-station"` \| `"pedestal, plinth, footstall"` \| `"pencil box, pencil case"` \| `"pencil sharpener"` \| `"perfume, essence"` \| `"Petri dish"` \| `"photocopier"` \| `"pick, plectrum, plectron"` \| `"pickelhaube"` \| `"picket fence, paling"` \| `"pickup, pickup truck"` \| `"pier"` \| `"piggy bank, penny bank"` \| `"pill bottle"` \| `"pillow"` \| `"ping-pong ball"` \| `"pinwheel"` \| `"pirate, pirate ship"` \| `"pitcher, ewer"` \| `"plane, carpenter's plane, woodworking plane"` \| `"planetarium"` \| `"plastic bag"` \| `"plate rack"` \| `"plow, plough"` \| `"plunger, plumber's helper"` \| `"Polaroid camera, Polaroid Land camera"` \| `"pole"` \| `"police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria"` \| `"poncho"` \| `"pool table, billiard table, snooker table"` \| `"pop bottle, soda bottle"` \| `"pot, flowerpot"` \| `"potter's wheel"` \| `"power drill"` \| `"prayer rug, prayer mat"` \| `"printer"` \| `"prison, prison house"` \| `"projectile, missile"` \| `"projector"` \| `"puck, hockey puck"` \| `"punching bag, punch bag, punching ball, punchball"` \| `"purse"` \| `"quill, quill pen"` \| `"quilt, comforter, comfort, puff"` \| `"racer, race car, racing car"` \| `"racket, racquet"` \| `"radiator"` \| `"radio, wireless"` \| `"radio telescope, radio reflector"` \| `"rain barrel"` \| `"recreational vehicle, RV, R.V."` \| `"reel"` \| `"reflex camera"` \| `"refrigerator, icebox"` \| `"remote control, remote"` \| `"restaurant, eating house, eating place, eatery"` \| `"revolver, six-gun, six-shooter"` \| `"rifle"` \| `"rocking chair, rocker"` \| `"rotisserie"` \| `"rubber eraser, rubber, pencil eraser"` \| `"rugby ball"` \| `"rule, ruler"` \| `"running shoe"` \| `"safe"` \| `"safety pin"` \| `"saltshaker, salt shaker"` \| `"sandal"` \| `"sarong"` \| `"sax, saxophone"` \| `"scabbard"` \| `"scale, weighing machine"` \| `"school bus"` \| `"schooner"` \| `"scoreboard"` \| `"screen, CRT screen"` \| `"screw"` \| `"screwdriver"` \| `"seat belt, seatbelt"` \| `"sewing machine"` \| `"shield, buckler"` \| `"shoe shop, shoe-shop, shoe store"` \| `"shoji"` \| `"shopping basket"` \| `"shopping cart"` \| `"shovel"` \| `"shower cap"` \| `"shower curtain"` \| `"ski"` \| `"ski mask"` \| `"sleeping bag"` \| `"slide rule, slipstick"` \| `"sliding door"` \| `"slot, one-armed bandit"` \| `"snorkel"` \| `"snowmobile"` \| `"snowplow, snowplough"` \| `"soap dispenser"` \| `"soccer ball"` \| `"sock"` \| `"solar dish, solar collector, solar furnace"` \| `"sombrero"` \| `"soup bowl"` \| `"space bar"` \| `"space heater"` \| `"space shuttle"` \| `"spatula"` \| `"speedboat"` \| `"spider web, spider's web"` \| `"spindle"` \| `"sports car, sport car"` \| `"spotlight, spot"` \| `"stage"` \| `"steam locomotive"` \| `"steel arch bridge"` \| `"steel drum"` \| `"stethoscope"` \| `"stole"` \| `"stone wall"` \| `"stopwatch, stop watch"` \| `"stove"` \| `"strainer"` \| `"streetcar, tram, tramcar, trolley, trolley car"` \| `"stretcher"` \| `"studio couch, day bed"` \| `"stupa, tope"` \| `"submarine, pigboat, sub, U-boat"` \| `"suit, suit of clothes"` \| `"sundial"` \| `"sunglass"` \| `"sunglasses, dark glasses, shades"` \| `"sunscreen, sunblock, sun blocker"` \| `"suspension bridge"` \| `"swab, swob, mop"` \| `"sweatshirt"` \| `"swimming trunks, bathing trunks"` \| `"swing"` \| `"switch, electric switch, electrical switch"` \| `"syringe"` \| `"table lamp"` \| `"tank, army tank, armored combat vehicle, armoured combat vehicle"` \| `"tape player"` \| `"teapot"` \| `"teddy, teddy bear"` \| `"television, television system"` \| `"tennis ball"` \| `"thatch, thatched roof"` \| `"theater curtain, theatre curtain"` \| `"thimble"` \| `"thresher, thrasher, threshing machine"` \| `"throne"` \| `"tile roof"` \| `"toaster"` \| `"tobacco shop, tobacconist shop, tobacconist"` \| `"toilet seat"` \| `"torch"` \| `"totem pole"` \| `"tow truck, tow car, wrecker"` \| `"toyshop"` \| `"tractor"` \| `"trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi"` \| `"tray"` \| `"trench coat"` \| `"tricycle, trike, velocipede"` \| `"trimaran"` \| `"tripod"` \| `"triumphal arch"` \| `"trolleybus, trolley coach, trackless trolley"` \| `"trombone"` \| `"tub, vat"` \| `"turnstile"` \| `"typewriter keyboard"` \| `"umbrella"` \| `"unicycle, monocycle"` \| `"upright, upright piano"` \| `"vacuum, vacuum cleaner"` \| `"vase"` \| `"vault"` \| `"velvet"` \| `"vending machine"` \| `"vestment"` \| `"viaduct"` \| `"violin, fiddle"` \| `"volleyball"` \| `"waffle iron"` \| `"wall clock"` \| `"wallet, billfold, notecase, pocketbook"` \| `"wardrobe, closet, press"` \| `"warplane, military plane"` \| `"washbasin, handbasin, washbowl, lavabo, wash-hand basin"` \| `"washer, automatic washer, washing machine"` \| `"water bottle"` \| `"water jug"` \| `"water tower"` \| `"whiskey jug"` \| `"whistle"` \| `"wig"` \| `"window screen"` \| `"window shade"` \| `"Windsor tie"` \| `"wine bottle"` \| `"wing"` \| `"wok"` \| `"wooden spoon"` \| `"wool, woolen, woollen"` \| `"worm fence, snake fence, snake-rail fence, Virginia fence"` \| `"wreck"` \| `"yawl"` \| `"yurt"` \| `"web site, website, internet site, site"` \| `"comic book"` \| `"crossword puzzle, crossword"` \| `"street sign"` \| `"traffic light, traffic signal, stoplight"` \| `"book jacket, dust cover, dust jacket, dust wrapper"` \| `"menu"` \| `"plate"` \| `"guacamole"` \| `"consomme"` \| `"hot pot, hotpot"` \| `"trifle"` \| `"ice cream, icecream"` \| `"ice lolly, lolly, lollipop, popsicle"` \| `"French loaf"` \| `"bagel, beigel"` \| `"pretzel"` \| `"cheeseburger"` \| `"hotdog, hot dog, red hot"` \| `"mashed potato"` \| `"head cabbage"` \| `"broccoli"` \| `"cauliflower"` \| `"zucchini, courgette"` \| `"spaghetti squash"` \| `"acorn squash"` \| `"butternut squash"` \| `"cucumber, cuke"` \| `"artichoke, globe artichoke"` \| `"bell pepper"` \| `"cardoon"` \| `"mushroom"` \| `"Granny Smith"` \| `"strawberry"` \| `"orange"` \| `"lemon"` \| `"fig"` \| `"pineapple, ananas"` \| `"banana"` \| `"jackfruit, jak, jack"` \| `"custard apple"` \| `"pomegranate"` \| `"hay"` \| `"carbonara"` \| `"chocolate sauce, chocolate syrup"` \| `"dough"` \| `"meat loaf, meatloaf"` \| `"pizza, pizza pie"` \| `"potpie"` \| `"burrito"` \| `"red wine"` \| `"espresso"` \| `"cup"` \| `"eggnog"` \| `"alp"` \| `"bubble"` \| `"cliff, drop, drop-off"` \| `"coral reef"` \| `"geyser"` \| `"lakeside, lakeside road, lakeshore"` \| `"promontory, headland, head, foreland"` \| `"sandbar, sand bar"` \| `"seashore, coast, seacoast, sea-coast"` \| `"valley, vale"` \| `"volcano"` \| `"ballplayer, baseball player"` \| `"groom, bridegroom"` \| `"scuba diver"` \| `"rapeseed"` \| `"daisy"` \| `"yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum"` \| `"corn"` \| `"acorn"` \| `"hip, rose hip, rosehip"` \| `"buckeye, horse chestnut, conker"` \| `"coral fungus"` \| `"agaric"` \| `"gyromitra"` \| `"stinkhorn, carrion fungus"` \| `"earthstar"` \| `"hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa"` \| `"bolete"` \| `"ear, spike, capitulum"` \| `"toilet tissue, toilet paper, bathroom tissue"`\> = `EFFICIENTNET_V2_S_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`"tench, Tinca tinca"` \| `"goldfish, Carassius auratus"` \| `"great white shark, white shark, man-eater, man-eating shark, Carcharodon carcharias"` \| `"tiger shark, Galeocerdo cuvieri"` \| `"hammerhead, hammerhead shark"` \| `"electric ray, crampfish, numbfish, torpedo"` \| `"stingray"` \| `"cock"` \| `"hen"` \| `"ostrich, Struthio camelus"` \| `"brambling, Fringilla montifringilla"` \| `"goldfinch, Carduelis carduelis"` \| `"house finch, linnet, Carpodacus mexicanus"` \| `"junco, snowbird"` \| `"indigo bunting, indigo finch, indigo bird, Passerina cyanea"` \| `"robin, American robin, Turdus migratorius"` \| `"bulbul"` \| `"jay"` \| `"magpie"` \| `"chickadee"` \| `"water ouzel, dipper"` \| `"kite"` \| `"bald eagle, American eagle, Haliaeetus leucocephalus"` \| `"vulture"` \| `"great grey owl, great gray owl, Strix nebulosa"` \| `"European fire salamander, Salamandra salamandra"` \| `"common newt, Triturus vulgaris"` \| `"eft"` \| `"spotted salamander, Ambystoma maculatum"` \| `"axolotl, mud puppy, Ambystoma mexicanum"` \| `"bullfrog, Rana catesbeiana"` \| `"tree frog, tree-frog"` \| `"tailed frog, bell toad, ribbed toad, tailed toad, Ascaphus trui"` \| `"loggerhead, loggerhead turtle, Caretta caretta"` \| `"leatherback turtle, leatherback, leathery turtle, Dermochelys coriacea"` \| `"mud turtle"` \| `"terrapin"` \| `"box turtle, box tortoise"` \| `"banded gecko"` \| `"common iguana, iguana, Iguana iguana"` \| `"American chameleon, anole, Anolis carolenensis"` \| `"whiptail, whiptail lizard"` \| `"agama"` \| `"frilled lizard, Chlamydosaurus kingi"` \| `"alligator lizard"` \| `"Gila monster, Heloderma suspectum"` \| `"green lizard, Lacerta viridis"` \| `"African chameleon, Chamaeleo chamaeleon"` \| `"Komodo dragon, Komodo lizard, dragon lizard, giant lizard, Varanus komodoensis"` \| `"African crocodile, Nile crocodile, Crocodylus niloticus"` \| `"American alligator, Alligator mississipiensis"` \| `"triceratops"` \| `"thunder snake, worm snake, Carphophis amoenus"` \| `"ringneck snake, ring-necked snake, ring snake"` \| `"hognose snake, puff adder, sand viper"` \| `"green snake, grass snake"` \| `"king snake, kingsnake"` \| `"garter snake, grass snake"` \| `"water snake"` \| `"vine snake"` \| `"night snake, Hypsiglena torquata"` \| `"boa constrictor, Constrictor constrictor"` \| `"rock python, rock snake, Python sebae"` \| `"Indian cobra, Naja naja"` \| `"green mamba"` \| `"sea snake"` \| `"horned viper, cerastes, sand viper, horned asp, Cerastes cornutus"` \| `"diamondback, diamondback rattlesnake, Crotalus adamanteus"` \| `"sidewinder, horned rattlesnake, Crotalus cerastes"` \| `"trilobite"` \| `"harvestman, daddy longlegs, Phalangium opilio"` \| `"scorpion"` \| `"black and gold garden spider, Argiope aurantia"` \| `"barn spider, Araneus cavaticus"` \| `"garden spider, Aranea diademata"` \| `"black widow, Latrodectus mactans"` \| `"tarantula"` \| `"wolf spider, hunting spider"` \| `"tick"` \| `"centipede"` \| `"black grouse"` \| `"ptarmigan"` \| `"ruffed grouse, partridge, Bonasa umbellus"` \| `"prairie chicken, prairie grouse, prairie fowl"` \| `"peacock"` \| `"quail"` \| `"partridge"` \| `"African grey, African gray, Psittacus erithacus"` \| `"macaw"` \| `"sulphur-crested cockatoo, Kakatoe galerita, Cacatua galerita"` \| `"lorikeet"` \| `"coucal"` \| `"bee eater"` \| `"hornbill"` \| `"hummingbird"` \| `"jacamar"` \| `"toucan"` \| `"drake"` \| `"red-breasted merganser, Mergus serrator"` \| `"goose"` \| `"black swan, Cygnus atratus"` \| `"tusker"` \| `"echidna, spiny anteater, anteater"` \| `"platypus, duckbill, duckbilled platypus, duck-billed platypus, Ornithorhynchus anatinus"` \| `"wallaby, brush kangaroo"` \| `"koala, koala bear, kangaroo bear, native bear, Phascolarctos cinereus"` \| `"wombat"` \| `"jellyfish"` \| `"sea anemone, anemone"` \| `"brain coral"` \| `"flatworm, platyhelminth"` \| `"nematode, nematode worm, roundworm"` \| `"conch"` \| `"snail"` \| `"slug"` \| `"sea slug, nudibranch"` \| `"chiton, coat-of-mail shell, sea cradle, polyplacophore"` \| `"chambered nautilus, pearly nautilus, nautilus"` \| `"Dungeness crab, Cancer magister"` \| `"rock crab, Cancer irroratus"` \| `"fiddler crab"` \| `"king crab, Alaska crab, Alaskan king crab, Alaska king crab, Paralithodes camtschatica"` \| `"American lobster, Northern lobster, Maine lobster, Homarus americanus"` \| `"spiny lobster, langouste, rock lobster, crawfish, crayfish, sea crawfish"` \| `"crayfish, crawfish, crawdad, crawdaddy"` \| `"hermit crab"` \| `"isopod"` \| `"white stork, Ciconia ciconia"` \| `"black stork, Ciconia nigra"` \| `"spoonbill"` \| `"flamingo"` \| `"little blue heron, Egretta caerulea"` \| `"American egret, great white heron, Egretta albus"` \| `"bittern"` \| `"crane"` \| `"limpkin, Aramus pictus"` \| `"European gallinule, Porphyrio porphyrio"` \| `"American coot, marsh hen, mud hen, water hen, Fulica americana"` \| `"bustard"` \| `"ruddy turnstone, Arenaria interpres"` \| `"red-backed sandpiper, dunlin, Erolia alpina"` \| `"redshank, Tringa totanus"` \| `"dowitcher"` \| `"oystercatcher, oyster catcher"` \| `"pelican"` \| `"king penguin, Aptenodytes patagonica"` \| `"albatross, mollymawk"` \| `"grey whale, gray whale, devilfish, Eschrichtius gibbosus, Eschrichtius robustus"` \| `"killer whale, killer, orca, grampus, sea wolf, Orcinus orca"` \| `"dugong, Dugong dugon"` \| `"sea lion"` \| `"Chihuahua"` \| `"Japanese spaniel"` \| `"Maltese dog, Maltese terrier, Maltese"` \| `"Pekinese, Pekingese, Peke"` \| `"Shih-Tzu"` \| `"Blenheim spaniel"` \| `"papillon"` \| `"toy terrier"` \| `"Rhodesian ridgeback"` \| `"Afghan hound, Afghan"` \| `"basset, basset hound"` \| `"beagle"` \| `"bloodhound, sleuthhound"` \| `"bluetick"` \| `"black-and-tan coonhound"` \| `"Walker hound, Walker foxhound"` \| `"English foxhound"` \| `"redbone"` \| `"borzoi, Russian wolfhound"` \| `"Irish wolfhound"` \| `"Italian greyhound"` \| `"whippet"` \| `"Ibizan hound, Ibizan Podenco"` \| `"Norwegian elkhound, elkhound"` \| `"otterhound, otter hound"` \| `"Saluki, gazelle hound"` \| `"Scottish deerhound, deerhound"` \| `"Weimaraner"` \| `"Staffordshire bullterrier, Staffordshire bull terrier"` \| `"American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier"` \| `"Bedlington terrier"` \| `"Border terrier"` \| `"Kerry blue terrier"` \| `"Irish terrier"` \| `"Norfolk terrier"` \| `"Norwich terrier"` \| `"Yorkshire terrier"` \| `"wire-haired fox terrier"` \| `"Lakeland terrier"` \| `"Sealyham terrier, Sealyham"` \| `"Airedale, Airedale terrier"` \| `"cairn, cairn terrier"` \| `"Australian terrier"` \| `"Dandie Dinmont, Dandie Dinmont terrier"` \| `"Boston bull, Boston terrier"` \| `"miniature schnauzer"` \| `"giant schnauzer"` \| `"standard schnauzer"` \| `"Scotch terrier, Scottish terrier, Scottie"` \| `"Tibetan terrier, chrysanthemum dog"` \| `"silky terrier, Sydney silky"` \| `"soft-coated wheaten terrier"` \| `"West Highland white terrier"` \| `"Lhasa, Lhasa apso"` \| `"flat-coated retriever"` \| `"curly-coated retriever"` \| `"golden retriever"` \| `"Labrador retriever"` \| `"Chesapeake Bay retriever"` \| `"German short-haired pointer"` \| `"vizsla, Hungarian pointer"` \| `"English setter"` \| `"Irish setter, red setter"` \| `"Gordon setter"` \| `"Brittany spaniel"` \| `"clumber, clumber spaniel"` \| `"English springer, English springer spaniel"` \| `"Welsh springer spaniel"` \| `"cocker spaniel, English cocker spaniel, cocker"` \| `"Sussex spaniel"` \| `"Irish water spaniel"` \| `"kuvasz"` \| `"schipperke"` \| `"groenendael"` \| `"malinois"` \| `"briard"` \| `"kelpie"` \| `"komondor"` \| `"Old English sheepdog, bobtail"` \| `"Shetland sheepdog, Shetland sheep dog, Shetland"` \| `"collie"` \| `"Border collie"` \| `"Bouvier des Flandres, Bouviers des Flandres"` \| `"Rottweiler"` \| `"German shepherd, German shepherd dog, German police dog, alsatian"` \| `"Doberman, Doberman pinscher"` \| `"miniature pinscher"` \| `"Greater Swiss Mountain dog"` \| `"Bernese mountain dog"` \| `"Appenzeller"` \| `"EntleBucher"` \| `"boxer"` \| `"bull mastiff"` \| `"Tibetan mastiff"` \| `"French bulldog"` \| `"Great Dane"` \| `"Saint Bernard, St Bernard"` \| `"Eskimo dog, husky"` \| `"malamute, malemute, Alaskan malamute"` \| `"Siberian husky"` \| `"dalmatian, coach dog, carriage dog"` \| `"affenpinscher, monkey pinscher, monkey dog"` \| `"basenji"` \| `"pug, pug-dog"` \| `"Leonberg"` \| `"Newfoundland, Newfoundland dog"` \| `"Great Pyrenees"` \| `"Samoyed, Samoyede"` \| `"Pomeranian"` \| `"chow, chow chow"` \| `"keeshond"` \| `"Brabancon griffon"` \| `"Pembroke, Pembroke Welsh corgi"` \| `"Cardigan, Cardigan Welsh corgi"` \| `"toy poodle"` \| `"miniature poodle"` \| `"standard poodle"` \| `"Mexican hairless"` \| `"timber wolf, grey wolf, gray wolf, Canis lupus"` \| `"white wolf, Arctic wolf, Canis lupus tundrarum"` \| `"red wolf, maned wolf, Canis rufus, Canis niger"` \| `"coyote, prairie wolf, brush wolf, Canis latrans"` \| `"dingo, warrigal, warragal, Canis dingo"` \| `"dhole, Cuon alpinus"` \| `"African hunting dog, hyena dog, Cape hunting dog, Lycaon pictus"` \| `"hyena, hyaena"` \| `"red fox, Vulpes vulpes"` \| `"kit fox, Vulpes macrotis"` \| `"Arctic fox, white fox, Alopex lagopus"` \| `"grey fox, gray fox, Urocyon cinereoargenteus"` \| `"tabby, tabby cat"` \| `"tiger cat"` \| `"Persian cat"` \| `"Siamese cat, Siamese"` \| `"Egyptian cat"` \| `"cougar, puma, catamount, mountain lion, painter, panther, Felis concolor"` \| `"lynx, catamount"` \| `"leopard, Panthera pardus"` \| `"snow leopard, ounce, Panthera uncia"` \| `"jaguar, panther, Panthera onca, Felis onca"` \| `"lion, king of beasts, Panthera leo"` \| `"tiger, Panthera tigris"` \| `"cheetah, chetah, Acinonyx jubatus"` \| `"brown bear, bruin, Ursus arctos"` \| `"American black bear, black bear, Ursus americanus, Euarctos americanus"` \| `"ice bear, polar bear, Ursus Maritimus, Thalarctos maritimus"` \| `"sloth bear, Melursus ursinus, Ursus ursinus"` \| `"mongoose"` \| `"meerkat, mierkat"` \| `"tiger beetle"` \| `"ladybug, ladybeetle, lady beetle, ladybird, ladybird beetle"` \| `"ground beetle, carabid beetle"` \| `"long-horned beetle, longicorn, longicorn beetle"` \| `"leaf beetle, chrysomelid"` \| `"dung beetle"` \| `"rhinoceros beetle"` \| `"weevil"` \| `"fly"` \| `"bee"` \| `"ant, emmet, pismire"` \| `"grasshopper, hopper"` \| `"cricket"` \| `"walking stick, walkingstick, stick insect"` \| `"cockroach, roach"` \| `"focused mantis, mantid"` \| `"cicada, cicala"` \| `"leafhopper"` \| `"lacewing, lacewing fly"` \| `"dragonfly, darning needle, devil's darning needle, sewing needle, snake feeder, snake doctor, mosquito hawk, skeeter hawk"` \| `"damselfly"` \| `"admiral"` \| `"ringlet, ringlet butterfly"` \| `"monarch, monarch butterfly, milkweed butterfly, Danaus plexippus"` \| `"cabbage butterfly"` \| `"sulphur butterfly, sulfur butterfly"` \| `"lycaenid, lycaenid butterfly"` \| `"starfish, sea star"` \| `"sea urchin"` \| `"sea cucumber, holothurian"` \| `"wood rabbit, cottontail, cottontail rabbit"` \| `"hare"` \| `"Angora, Angora rabbit"` \| `"hamster"` \| `"porcupine, hedgehog"` \| `"fox squirrel, eastern fox squirrel, Sciurus niger"` \| `"marmot"` \| `"beaver"` \| `"guinea pig, Cavia cobaya"` \| `"sorrel"` \| `"zebra"` \| `"hog, pig, grunter, squealer, Sus scrofa"` \| `"wild boar, boar, Sus scrofa"` \| `"warthog"` \| `"hippopotamus, hippo, river horse, Hippopotamus amphibius"` \| `"ox"` \| `"water buffalo, water ox, Asiatic buffalo, Bubalus bubalis"` \| `"bison"` \| `"ram, tup"` \| `"bighorn, bighorn sheep, cimarron, Rocky Mountain bighorn, Rocky Mountain sheep, Ovis canadensis"` \| `"ibex, Capra ibex"` \| `"hartebeest"` \| `"impala, Aepyceros melampus"` \| `"gazelle"` \| `"Arabian camel, dromedary, Camelus dromedarius"` \| `"llama"` \| `"weasel"` \| `"mink"` \| `"polecat, fitch, foulmart, foumart, Mustela putorius"` \| `"black-footed ferret, ferret, Mustela nigripes"` \| `"otter"` \| `"skunk, polecat, wood pussy"` \| `"badger"` \| `"armadillo"` \| `"three-toed sloth, ai, Bradypus tridactylus"` \| `"orangutan, orang, orangutang, Pongo pygmaeus"` \| `"gorilla, Gorilla gorilla"` \| `"chimpanzee, chimp, Pan troglodytes"` \| `"gibbon, Hylobates lar"` \| `"siamang, Hylobates syndactylus, Symphalangus syndactylus"` \| `"guenon, guenon monkey"` \| `"patas, hussar monkey, Erythrocebus patas"` \| `"baboon"` \| `"macaque"` \| `"langur"` \| `"colobus, colobus monkey"` \| `"proboscis monkey, Nasalis larvatus"` \| `"marmoset"` \| `"capuchin, ringtail, Cebus capucinus"` \| `"howler monkey, howler"` \| `"titi, titi monkey"` \| `"spider monkey, Ateles geoffroyi"` \| `"squirrel monkey, Saimiri sciureus"` \| `"Madagascar cat, ring-tailed lemur, Lemur catta"` \| `"indri, indris, Indri indri, Indri brevicaudatus"` \| `"Indian elephant, Elephas maximus"` \| `"African elephant, Loxodonta africana"` \| `"lesser panda, red panda, panda, bear cat, cat bear, Ailurus fulgens"` \| `"giant panda, panda, panda bear, coon bear, Ailuropoda melanoleuca"` \| `"barracouta, snoek"` \| `"raw eel, eel"` \| `"coho, cohoe, coho salmon, blue jack, silver salmon, Oncorhynchus kisutch"` \| `"rock beauty, Holocanthus tricolor"` \| `"anemone fish"` \| `"sturgeon"` \| `"gar, garfish, garpike, billfish, Lepisosteus osseus"` \| `"lionfish"` \| `"puffer, pufferfish, blowfish, globefish"` \| `"abacus"` \| `"abaya"` \| `"academic gown, academic robe, judge's robe"` \| `"accordion, piano accordion, squeeze box"` \| `"acoustic guitar"` \| `"aircraft carrier, carrier, flattop, attack aircraft carrier"` \| `"airliner"` \| `"airship, dirigible"` \| `"altar"` \| `"ambulance"` \| `"amphibian, amphibious vehicle"` \| `"analog clock"` \| `"apiary, bee house"` \| `"apron"` \| `"ashcan, trash can, garbage can, wastebin, ash bin, ash-bin, ashbin, dustbin, trash barrel, trash bin"` \| `"assault rifle, assault gun"` \| `"backpack, back pack, knapsack, packsack, rucksack, haversack"` \| `"bakery, bakeshop, bakehouse"` \| `"balance beam, beam"` \| `"balloon"` \| `"ballpoint, ballpoint pen, ballpen, Biro"` \| `"Band Aid"` \| `"banjo"` \| `"bannister, banister, balustrade, balusters, handrail"` \| `"barbell"` \| `"barber chair"` \| `"barbershop"` \| `"barn"` \| `"barometer"` \| `"barrel, cask"` \| `"barrow, garden cart, lawn cart, wheelbarrow"` \| `"baseball"` \| `"basketball"` \| `"bassinet"` \| `"bassoon"` \| `"bathing cap, swimming cap"` \| `"bath towel"` \| `"bathtub, bathing tub, bath, tub"` \| `"beach wagon, station wagon, wagon, estate car, beach waggon, station waggon, waggon"` \| `"beacon, lighthouse, beacon light, pharos"` \| `"beaker"` \| `"bearskin, busby, shako"` \| `"beer bottle"` \| `"beer glass"` \| `"bell cote, bell cot"` \| `"bib"` \| `"bicycle-built-for-two, tandem bicycle, tandem"` \| `"bikini, two-piece"` \| `"binder, ring-binder"` \| `"binoculars, field glasses, opera glasses"` \| `"birdhouse"` \| `"boathouse"` \| `"bobsled, bobsleigh, bob"` \| `"bolo tie, bolo, bola tie, bola"` \| `"bonnet, poke bonnet"` \| `"bookcase"` \| `"bookshop, bookstore, bookstall"` \| `"bottlecap"` \| `"bow"` \| `"bow tie, bow-tie, bowtie"` \| `"brass, memorial tablet, plaque"` \| `"brassiere, bra, bandeau"` \| `"breakwater, groin, groyne, mole, bulwark, seawall, jetty"` \| `"breastplate, aegis, egis"` \| `"broom"` \| `"bucket, pail"` \| `"buckle"` \| `"bulletproof vest"` \| `"bullet train, bullet"` \| `"butcher shop, meat market"` \| `"cab, hack, taxi, taxicab"` \| `"caldron, cauldron"` \| `"candle, taper, wax light"` \| `"cannon"` \| `"canoe"` \| `"can opener, tin opener"` \| `"cardigan"` \| `"car mirror"` \| `"carousel, carrousel, merry-go-round, roundabout, whirligig"` \| `"carpenter's kit, tool kit"` \| `"carton"` \| `"car wheel"` \| `"cash machine, cash dispenser, automated teller machine, automatic teller machine, automated teller, automatic teller, ATM"` \| `"cassette"` \| `"cassette player"` \| `"castle"` \| `"catamaran"` \| `"CD player"` \| `"cello, violoncello"` \| `"cellular telephone, cellular phone, cellphone, cell, mobile phone"` \| `"chain"` \| `"chainlink fence"` \| `"chain mail, ring mail, mail, chain armor, chain armour, ring armor, ring armour"` \| `"chain saw, chainsaw"` \| `"chest"` \| `"chiffonier, commode"` \| `"chime, bell, gong"` \| `"china cabinet, china closet"` \| `"Christmas stocking"` \| `"church, church building"` \| `"cinema, movie theater, movie theatre, movie house, picture palace"` \| `"cleaver, meat cleaver, chopper"` \| `"cliff dwelling"` \| `"cloak"` \| `"clog, geta, patten, sabot"` \| `"cocktail shaker"` \| `"coffee mug"` \| `"coffeepot"` \| `"coil, spiral, volute, whorl, helix"` \| `"combination lock"` \| `"computer keyboard, keypad"` \| `"confectionery, confectionery store, candy store"` \| `"container ship, containership, container vessel"` \| `"convertible"` \| `"corkscrew, bottle screw"` \| `"cornet, horn, trumpet, trump"` \| `"cowboy boot"` \| `"cowboy hat, ten-gallon hat"` \| `"cradle"` \| `"crash helmet"` \| `"crate"` \| `"crib, cot"` \| `"Crock Pot"` \| `"croquet ball"` \| `"crutch"` \| `"cuirass"` \| `"dam, dike, dyke"` \| `"desk"` \| `"desktop computer"` \| `"dial telephone, dial phone"` \| `"diaper, nappy, napkin"` \| `"digital clock"` \| `"digital watch"` \| `"dining table, board"` \| `"dishrag, dishcloth"` \| `"dishwasher, dish washer, dishwashing machine"` \| `"disk brake, disc brake"` \| `"dock, dockage, docking facility"` \| `"dogsled, dog sled, dog sleigh"` \| `"dome"` \| `"doormat, welcome mat"` \| `"drilling platform, offshore rig"` \| `"drum, membranophone, tympan"` \| `"drumstick"` \| `"dumbbell"` \| `"Dutch oven"` \| `"electric fan, blower"` \| `"electric guitar"` \| `"electric locomotive"` \| `"entertainment center"` \| `"envelope"` \| `"espresso maker"` \| `"face powder"` \| `"feather boa, boa"` \| `"file, file cabinet, filing cabinet"` \| `"fireboat"` \| `"fire engine, fire truck"` \| `"fire screen, fireguard"` \| `"flagpole, flagstaff"` \| `"flute, transverse flute"` \| `"folding chair"` \| `"football helmet"` \| `"forklift"` \| `"fountain"` \| `"fountain pen"` \| `"four-poster"` \| `"freight car"` \| `"French horn, horn"` \| `"frying pan, frypan, skillet"` \| `"fur coat"` \| `"garbage truck, dustcart"` \| `"gasmask, respirator, gas helmet"` \| `"gas pump, gasoline pump, petrol pump, island dispenser"` \| `"goblet"` \| `"go-kart"` \| `"golf ball"` \| `"golfcart, golf cart"` \| `"gondola"` \| `"gong, tam-tam"` \| `"gown"` \| `"grand piano, grand"` \| `"greenhouse, nursery, glasshouse"` \| `"grille, radiator grille"` \| `"grocery store, grocery, food market, market"` \| `"guillotine"` \| `"hair slide"` \| `"hair spray"` \| `"half track"` \| `"hammer"` \| `"hamper"` \| `"hand blower, blow dryer, blow drier, hair dryer, hair drier"` \| `"hand-held computer, hand-held microcomputer"` \| `"handkerchief, hankie, hanky, hankey"` \| `"hard disc, hard disk, fixed disk"` \| `"harmonica, mouth organ, harp, mouth harp"` \| `"harp"` \| `"harvester, reaper"` \| `"hatchet"` \| `"holster"` \| `"home theater, home theatre"` \| `"honeycomb"` \| `"hook, claw"` \| `"hoopskirt, crinoline"` \| `"horizontal bar, high bar"` \| `"horse cart, horse-cart"` \| `"hourglass"` \| `"iPod"` \| `"iron, smoothing iron"` \| `"jack-o'-lantern"` \| `"jean, blue jean, denim"` \| `"jeep, landrover"` \| `"jersey, T-shirt, tee shirt"` \| `"jigsaw puzzle"` \| `"jinrikisha, ricksha, rickshaw"` \| `"joystick"` \| `"kimono"` \| `"knee pad"` \| `"knot"` \| `"lab coat, laboratory coat"` \| `"ladle"` \| `"lampshade, lamp shade"` \| `"laptop, laptop computer"` \| `"lawn mower, mower"` \| `"lens cap, lens cover"` \| `"letter opener, paper knife, paperknife"` \| `"library"` \| `"lifeboat"` \| `"lighter, light, igniter, ignitor"` \| `"limousine, limo"` \| `"liner, ocean liner"` \| `"lipstick, lip rouge"` \| `"Loafer"` \| `"lotion"` \| `"loudspeaker, speaker, speaker unit, loudspeaker system, speaker system"` \| `"loupe, jeweler's loupe"` \| `"lumbermill, sawmill"` \| `"magnetic compass"` \| `"mailbag, postbag"` \| `"mailbox, letter box"` \| `"maillot"` \| `"maillot, tank suit"` \| `"manhole cover"` \| `"maraca"` \| `"marimba, xylophone"` \| `"mask"` \| `"matchstick"` \| `"maypole"` \| `"maze, labyrinth"` \| `"measuring cup"` \| `"medicine chest, medicine cabinet"` \| `"megalith, megalithic structure"` \| `"microphone, mike"` \| `"microwave, microwave oven"` \| `"military uniform"` \| `"milk can"` \| `"minibus"` \| `"miniskirt, mini"` \| `"minivan"` \| `"missile"` \| `"mitten"` \| `"mixing bowl"` \| `"mobile home, manufactured home"` \| `"Model T"` \| `"modem"` \| `"monastery"` \| `"monitor"` \| `"moped"` \| `"mortar"` \| `"mortarboard"` \| `"mosque"` \| `"mosquito net"` \| `"motor scooter, scooter"` \| `"mountain bike, all-terrain bike, off-roader"` \| `"mountain tent"` \| `"mouse, computer mouse"` \| `"mousetrap"` \| `"moving van"` \| `"muzzle"` \| `"nail"` \| `"neck brace"` \| `"necklace"` \| `"nipple"` \| `"notebook, notebook computer"` \| `"obelisk"` \| `"oboe, hautboy, hautbois"` \| `"ocarina, sweet potato"` \| `"odometer, hodometer, mileometer, milometer"` \| `"oil filter"` \| `"organ, pipe organ"` \| `"oscilloscope, scope, cathode-ray oscilloscope, CRO"` \| `"overskirt"` \| `"oxcart"` \| `"oxygen mask"` \| `"packet"` \| `"paddle, boat paddle"` \| `"paddlewheel, paddle wheel"` \| `"padlock"` \| `"paintbrush"` \| `"pajama, pyjama, pj's, jammies"` \| `"palace"` \| `"panpipe, pandean pipe, syrinx"` \| `"paper towel"` \| `"parachute, chute"` \| `"parallel bars, bars"` \| `"park bench"` \| `"parking meter"` \| `"passenger car, coach, carriage"` \| `"patio, terrace"` \| `"pay-phone, pay-station"` \| `"pedestal, plinth, footstall"` \| `"pencil box, pencil case"` \| `"pencil sharpener"` \| `"perfume, essence"` \| `"Petri dish"` \| `"photocopier"` \| `"pick, plectrum, plectron"` \| `"pickelhaube"` \| `"picket fence, paling"` \| `"pickup, pickup truck"` \| `"pier"` \| `"piggy bank, penny bank"` \| `"pill bottle"` \| `"pillow"` \| `"ping-pong ball"` \| `"pinwheel"` \| `"pirate, pirate ship"` \| `"pitcher, ewer"` \| `"plane, carpenter's plane, woodworking plane"` \| `"planetarium"` \| `"plastic bag"` \| `"plate rack"` \| `"plow, plough"` \| `"plunger, plumber's helper"` \| `"Polaroid camera, Polaroid Land camera"` \| `"pole"` \| `"police van, police wagon, paddy wagon, patrol wagon, wagon, black Maria"` \| `"poncho"` \| `"pool table, billiard table, snooker table"` \| `"pop bottle, soda bottle"` \| `"pot, flowerpot"` \| `"potter's wheel"` \| `"power drill"` \| `"prayer rug, prayer mat"` \| `"printer"` \| `"prison, prison house"` \| `"projectile, missile"` \| `"projector"` \| `"puck, hockey puck"` \| `"punching bag, punch bag, punching ball, punchball"` \| `"purse"` \| `"quill, quill pen"` \| `"quilt, comforter, comfort, puff"` \| `"racer, race car, racing car"` \| `"racket, racquet"` \| `"radiator"` \| `"radio, wireless"` \| `"radio telescope, radio reflector"` \| `"rain barrel"` \| `"recreational vehicle, RV, R.V."` \| `"reel"` \| `"reflex camera"` \| `"refrigerator, icebox"` \| `"remote control, remote"` \| `"restaurant, eating house, eating place, eatery"` \| `"revolver, six-gun, six-shooter"` \| `"rifle"` \| `"rocking chair, rocker"` \| `"rotisserie"` \| `"rubber eraser, rubber, pencil eraser"` \| `"rugby ball"` \| `"rule, ruler"` \| `"running shoe"` \| `"safe"` \| `"safety pin"` \| `"saltshaker, salt shaker"` \| `"sandal"` \| `"sarong"` \| `"sax, saxophone"` \| `"scabbard"` \| `"scale, weighing machine"` \| `"school bus"` \| `"schooner"` \| `"scoreboard"` \| `"screen, CRT screen"` \| `"screw"` \| `"screwdriver"` \| `"seat belt, seatbelt"` \| `"sewing machine"` \| `"shield, buckler"` \| `"shoe shop, shoe-shop, shoe store"` \| `"shoji"` \| `"shopping basket"` \| `"shopping cart"` \| `"shovel"` \| `"shower cap"` \| `"shower curtain"` \| `"ski"` \| `"ski mask"` \| `"sleeping bag"` \| `"slide rule, slipstick"` \| `"sliding door"` \| `"slot, one-armed bandit"` \| `"snorkel"` \| `"snowmobile"` \| `"snowplow, snowplough"` \| `"soap dispenser"` \| `"soccer ball"` \| `"sock"` \| `"solar dish, solar collector, solar furnace"` \| `"sombrero"` \| `"soup bowl"` \| `"space bar"` \| `"space heater"` \| `"space shuttle"` \| `"spatula"` \| `"speedboat"` \| `"spider web, spider's web"` \| `"spindle"` \| `"sports car, sport car"` \| `"spotlight, spot"` \| `"stage"` \| `"steam locomotive"` \| `"steel arch bridge"` \| `"steel drum"` \| `"stethoscope"` \| `"stole"` \| `"stone wall"` \| `"stopwatch, stop watch"` \| `"stove"` \| `"strainer"` \| `"streetcar, tram, tramcar, trolley, trolley car"` \| `"stretcher"` \| `"studio couch, day bed"` \| `"stupa, tope"` \| `"submarine, pigboat, sub, U-boat"` \| `"suit, suit of clothes"` \| `"sundial"` \| `"sunglass"` \| `"sunglasses, dark glasses, shades"` \| `"sunscreen, sunblock, sun blocker"` \| `"suspension bridge"` \| `"swab, swob, mop"` \| `"sweatshirt"` \| `"swimming trunks, bathing trunks"` \| `"swing"` \| `"switch, electric switch, electrical switch"` \| `"syringe"` \| `"table lamp"` \| `"tank, army tank, armored combat vehicle, armoured combat vehicle"` \| `"tape player"` \| `"teapot"` \| `"teddy, teddy bear"` \| `"television, television system"` \| `"tennis ball"` \| `"thatch, thatched roof"` \| `"theater curtain, theatre curtain"` \| `"thimble"` \| `"thresher, thrasher, threshing machine"` \| `"throne"` \| `"tile roof"` \| `"toaster"` \| `"tobacco shop, tobacconist shop, tobacconist"` \| `"toilet seat"` \| `"torch"` \| `"totem pole"` \| `"tow truck, tow car, wrecker"` \| `"toyshop"` \| `"tractor"` \| `"trailer truck, tractor trailer, trucking rig, rig, articulated lorry, semi"` \| `"tray"` \| `"trench coat"` \| `"tricycle, trike, velocipede"` \| `"trimaran"` \| `"tripod"` \| `"triumphal arch"` \| `"trolleybus, trolley coach, trackless trolley"` \| `"trombone"` \| `"tub, vat"` \| `"turnstile"` \| `"typewriter keyboard"` \| `"umbrella"` \| `"unicycle, monocycle"` \| `"upright, upright piano"` \| `"vacuum, vacuum cleaner"` \| `"vase"` \| `"vault"` \| `"velvet"` \| `"vending machine"` \| `"vestment"` \| `"viaduct"` \| `"violin, fiddle"` \| `"volleyball"` \| `"waffle iron"` \| `"wall clock"` \| `"wallet, billfold, notecase, pocketbook"` \| `"wardrobe, closet, press"` \| `"warplane, military plane"` \| `"washbasin, handbasin, washbowl, lavabo, wash-hand basin"` \| `"washer, automatic washer, washing machine"` \| `"water bottle"` \| `"water jug"` \| `"water tower"` \| `"whiskey jug"` \| `"whistle"` \| `"wig"` \| `"window screen"` \| `"window shade"` \| `"Windsor tie"` \| `"wine bottle"` \| `"wing"` \| `"wok"` \| `"wooden spoon"` \| `"wool, woolen, woollen"` \| `"worm fence, snake fence, snake-rail fence, Virginia fence"` \| `"wreck"` \| `"yawl"` \| `"yurt"` \| `"web site, website, internet site, site"` \| `"comic book"` \| `"crossword puzzle, crossword"` \| `"street sign"` \| `"traffic light, traffic signal, stoplight"` \| `"book jacket, dust cover, dust jacket, dust wrapper"` \| `"menu"` \| `"plate"` \| `"guacamole"` \| `"consomme"` \| `"hot pot, hotpot"` \| `"trifle"` \| `"ice cream, icecream"` \| `"ice lolly, lolly, lollipop, popsicle"` \| `"French loaf"` \| `"bagel, beigel"` \| `"pretzel"` \| `"cheeseburger"` \| `"hotdog, hot dog, red hot"` \| `"mashed potato"` \| `"head cabbage"` \| `"broccoli"` \| `"cauliflower"` \| `"zucchini, courgette"` \| `"spaghetti squash"` \| `"acorn squash"` \| `"butternut squash"` \| `"cucumber, cuke"` \| `"artichoke, globe artichoke"` \| `"bell pepper"` \| `"cardoon"` \| `"mushroom"` \| `"Granny Smith"` \| `"strawberry"` \| `"orange"` \| `"lemon"` \| `"fig"` \| `"pineapple, ananas"` \| `"banana"` \| `"jackfruit, jak, jack"` \| `"custard apple"` \| `"pomegranate"` \| `"hay"` \| `"carbonara"` \| `"chocolate sauce, chocolate syrup"` \| `"dough"` \| `"meat loaf, meatloaf"` \| `"pizza, pizza pie"` \| `"potpie"` \| `"burrito"` \| `"red wine"` \| `"espresso"` \| `"cup"` \| `"eggnog"` \| `"alp"` \| `"bubble"` \| `"cliff, drop, drop-off"` \| `"coral reef"` \| `"geyser"` \| `"lakeside, lakeside road, lakeshore"` \| `"promontory, headland, head, foreland"` \| `"sandbar, sand bar"` \| `"seashore, coast, seacoast, sea-coast"` \| `"valley, vale"` \| `"volcano"` \| `"ballplayer, baseball player"` \| `"groom, bridegroom"` \| `"scuba diver"` \| `"rapeseed"` \| `"daisy"` \| `"yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum"` \| `"corn"` \| `"acorn"` \| `"hip, rose hip, rosehip"` \| `"buckeye, horse chestnut, conker"` \| `"coral fungus"` \| `"agaric"` \| `"gyromitra"` \| `"stinkhorn, carrion fungus"` \| `"earthstar"` \| `"hen-of-the-woods, hen of the woods, Polyporus frondosus, Grifola frondosa"` \| `"bolete"` \| `"ear, spike, capitulum"` \| `"toilet tissue, toilet paper, bathroom tissue"`\>

### imageEmbeddings

> **imageEmbeddings**: `object`

Image feature extraction and vision embedding models.

#### imageEmbeddings.CLIP_VIT_BASE_PATCH32

> **CLIP_VIT_BASE_PATCH32**: `object` & `object`

CLIP vision encoder (ViT-B/32) mapping images into a 512-dimensional
shared text-image space. Used for zero-shot visual classification and
cross-modal image search.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_IMAGE_COREML_FP16`

###### MLX_INT8

> **MLX_INT8**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_IMAGE_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_IMAGE_VULKAN_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_IMAGE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md)

### instanceSegmentation

> **instanceSegmentation**: `object`

Instance segmentation models predicting both bounding boxes and
fine-grained pixel masks per object instance.

#### instanceSegmentation.FASTSAM

> **FASTSAM**: `object`

Fast Segment Anything Model (FastSAM) for promptable or global object
instance mask segmentation. Available in Small (S) and Extra Large (X)
variants.

#### instanceSegmentation.FASTSAM.S

> **S**: `object` & `object`

FastSAM Small - lightweight instance segmenter for mobile.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\> = `FASTSAM_S_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\> = `FASTSAM_S_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\>

#### instanceSegmentation.FASTSAM.X

> **X**: `object` & `object`

FastSAM Extra Large - high-accuracy instance segmenter.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\> = `FASTSAM_X_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\> = `FASTSAM_X_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"object"`\>

#### instanceSegmentation.RFDETR_NANO

> **RFDETR_NANO**: `object` & `object`

RF-DETR (Roboflow Detection Transformer) Nano instance segmentation model
predicting COCO class masks and bounding boxes (see
[COCO_CLASSES](COCO_CLASSES.md)).

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `RFDETR_NANO_SEG_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `RFDETR_NANO_SEG_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

#### instanceSegmentation.YOLO26

> **YOLO26**: `object` & `object`

YOLO26 instance segmentation models predicting COCO class instance masks
and bounding boxes (see [COCO_CLASSES_YOLO](COCO_CLASSES_YOLO.md)). Available across
multiple sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions
(384x384, 512x512, 640x640).

##### Type Declaration

###### LARGE

> **LARGE**: `object` & `object`

Large scale YOLO26 instance segmentation model. High accuracy instance
segmentation variant for demanding visual pipelines.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_SEG_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### MEDIUM

> **MEDIUM**: `object` & `object`

Medium scale YOLO26 instance segmentation model. Higher mask boundary
precision for complex multi-object scenes.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_SEG_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### NANO

> **NANO**: `object` & `object`

Nano scale YOLO26 instance segmentation model. High speed, ultra low
latency mask generation.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_SEG_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SMALL

> **SMALL**: `object` & `object`

Small scale YOLO26 instance segmentation model. Balanced latency and
mask accuracy.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_SEG_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### XLARGE

> **XLARGE**: `object` & `object`

Extra Large scale YOLO26 instance segmentation model. Maximum instance
segmentation and mask delineation performance.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_SEG_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

### keypointDetection

> **keypointDetection**: `object`

Keypoint and pose detection models that estimate facial landmarks or human
body skeletal keypoints.

#### keypointDetection.BLAZEFACE

> **BLAZEFACE**: `object` & `object`

MediaPipe BlazeFace lightweight face detection and 6-point facial
landmark locator (eyes, nose, mouth, ears, see
[BLAZEFACE_LANDMARKS](BLAZEFACE_LANDMARKS.md)).

##### Type Declaration

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"noseTip"` \| `"mouthCenter"` \| `"leftEar"` \| `"rightEar"`\> = `BLAZEFACE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"noseTip"` \| `"mouthCenter"` \| `"leftEar"` \| `"rightEar"`\>

#### keypointDetection.RFDETR_KEYPOINT

> **RFDETR_KEYPOINT**: `object` & `object`

RF-DETR (Roboflow Detection Transformer) pose keypoint detector
predicting 17 COCO body keypoints (see [COCO_LANDMARKS](COCO_LANDMARKS.md)).

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `RFDETR_KEYPOINT_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `RFDETR_KEYPOINT_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\>

#### keypointDetection.YOLO26_POSE

> **YOLO26_POSE**: `object` & `object`

YOLO26 human pose estimation model predicting 17 COCO body keypoints (see
[COCO_LANDMARKS](COCO_LANDMARKS.md)). Available across 384x384, 512x512, and 640x640
resolutions.

##### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\> = `YOLO26_POSE_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\>

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`"xyxy"`, `"leftEye"` \| `"rightEye"` \| `"leftEar"` \| `"rightEar"` \| `"nose"` \| `"leftShoulder"` \| `"rightShoulder"` \| `"leftElbow"` \| `"rightElbow"` \| `"leftWrist"` \| `"rightWrist"` \| `"leftHip"` \| `"rightHip"` \| `"leftKnee"` \| `"rightKnee"` \| `"leftAnkle"` \| `"rightAnkle"`\>

### llm

> **llm**: `object`

Generative Large Language Models (LLMs) for instruction following, chat,
text generation, and reasoning.

#### llm.BIELIK_V3_1_5B

> **BIELIK_V3_1_5B**: `object` & `object`

Bielik v3 1.5B bilingual Polish & English language model, developed by
SpeakLeash. Fine-tuned on curated Polish corpora and instruction datasets
for native Polish cultural nuance, grammar accuracy, idioms, and
high-fidelity bidirectional Polish-English translation.

##### Type Declaration

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `BIELIK_V3_1_5B_XNNPACK_8DA4W`

###### XNNPACK_FP16

> **XNNPACK_FP16**: [`LLMModel`](../type-aliases/LLMModel.md) = `BIELIK_V3_1_5B_XNNPACK_FP16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.GEMMA4_E2B

> **GEMMA4_E2B**: `object` & `object`

Google Gemma 4 E2B generative language model. Built on Google's Gemini
research and architecture innovations, offering high-fidelity instruction
following, creative text generation, and reasoning efficiency optimized
for mobile deployment.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `GEMMA4_E2B_MLX_INT4`

###### VULKAN_8DA4W

> **VULKAN_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `GEMMA4_E2B_VULKAN_8DA4W`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `GEMMA4_E2B_XNNPACK_8DA4W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.HAMMER2_1_0_5B

> **HAMMER2_1_0_5B**: `object` & `object`

Hammer 2.1 0.5B specialized function-calling model. Fine-tuned
specifically for agentic tool use, structured JSON extraction, and
single/multi-tool invocation with ultra-low latency for real-time mobile
tool calling flows.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_0_5B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_0_5B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_0_5B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.HAMMER2_1_1_5B

> **HAMMER2_1_1_5B**: `object` & `object`

Hammer 2.1 1.5B function-calling language model. Optimized for multi-tool
agentic workflows, API parameter schema validation, and structured JSON
output generation on edge devices.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_1_5B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_1_5B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_1_5B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.HAMMER2_1_3B

> **HAMMER2_1_3B**: `object` & `object`

Hammer 2.1 3B high-capacity function-calling model. Provides top-tier
tool selection precision, multi-turn tool calling, error recovery, and
strict compliance with complex TypeScript/JSON schema specifications in
autonomous mobile agent pipelines.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_3B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_3B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `HAMMER2_1_3B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LFM2_5_1_2B

> **LFM2_5_1_2B**: `object` & `object`

Liquid AI LFM 2.5 1.2B general-purpose hybrid language model. Built on
the Liquid Foundation Model architecture for low memory bandwidth usage,
and high-throughput token generation. Delivers strong general-purpose
reasoning, instruction following, and fast multi-turn conversational chat
on mobile devices.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_1_2B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_1_2B_XNNPACK_8DA4W`

###### XNNPACK_FP16

> **XNNPACK_FP16**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_1_2B_XNNPACK_FP16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LFM2_5_350M

> **LFM2_5_350M**: `object` & `object`

Liquid AI LFM 2.5 350M ultra-compact hybrid language model. Optimized for
minimal memory footprint and sub-second first-token response times. Ideal
for lightweight text completion, fast intent classification, query
routing, and low-latency chat on resource-constrained edge hardware.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_350M_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_350M_XNNPACK_8DA4W`

###### XNNPACK_FP16

> **XNNPACK_FP16**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_350M_XNNPACK_FP16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LFM2_5_VL_1_6B

> **LFM2_5_VL_1_6B**: `object` & `object`

Liquid AI LFM 2.5 VL 1.6B high-capacity vision-language model. Provides
fine-grained visual scene understanding, document/chart interpretation,
detailed image captioning, and multi-turn visual dialogue with higher
precision and reasoning fidelity than the 450M variant.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_1_6B_MLX_INT4`

###### MLX_INT8

> **MLX_INT8**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_1_6B_MLX_INT8`

###### VULKAN_8DA4W

> **VULKAN_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_1_6B_VULKAN_8DA4W`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_1_6B_XNNPACK_8DA4W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LFM2_5_VL_450M

> **LFM2_5_VL_450M**: `object` & `object`

Liquid AI LFM 2.5 VL 450M lightweight multimodal vision-language model.
Combines Liquid hybrid language modeling with visual token embeddings for
real-time on-device visual question answering (VQA), image description,
UI element inspection, and low-latency multimodal conversational agents.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_450M_MLX_INT4`

###### VULKAN_8DA4W

> **VULKAN_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_450M_VULKAN_8DA4W`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `LFM2_5_VL_450M_XNNPACK_8DA4W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LLAMA3_2_1B

> **LLAMA3_2_1B**: `object` & `object`

Meta Llama 3.2 1B lightweight instruction-tuned multilingual model.
Features Grouped-Query Attention (GQA) and SpinQuant quantization for
compact memory utilization and high throughput. Well suited for on-device
text summarization, prompt rewriting, and lightweight conversational
assistance.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_1B_MLX_INT4`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_1B_BF16`

###### XNNPACK_SPINQUANT

> **XNNPACK_SPINQUANT**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_1B_SPINQUANT`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.LLAMA3_2_3B

> **LLAMA3_2_3B**: `object` & `object`

Meta Llama 3.2 3B instruction-tuned multilingual language model. Delivers
strong instruction adherence, multi-turn reasoning, and high-quality
content creation across 8+ core languages while maintaining a compact
on-device memory profile.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_3B_MLX_INT4`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_3B_BF16`

###### XNNPACK_SPINQUANT

> **XNNPACK_SPINQUANT**: [`LLMModel`](../type-aliases/LLMModel.md) = `LLAMA3_2_3B_SPINQUANT`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.PHI4_MINI

> **PHI4_MINI**: `object` & `object`

Microsoft Phi-4 Mini 3.8B high-density reasoning model. Trained on
synthetic textbook-grade datasets for state-of-the-art on-device STEM
problem solving, complex mathematical reasoning, multi-step code
synthesis, and structured analytical tasks.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `PHI4_MINI_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `PHI4_MINI_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `PHI4_MINI_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN2_5_0_5B

> **QWEN2_5_0_5B**: `object` & `object`

Alibaba Qwen 2.5 0.5B ultra-lightweight multilingual model. Trained on
18T tokens supporting 29+ languages; optimized for near-instant response
times, basic instruction following, multilingual translation, and
lightweight conversational assistants on mobile devices.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_0_5B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_0_5B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_0_5B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN2_5_1_5B

> **QWEN2_5_1_5B**: `object` & `object`

Alibaba Qwen 2.5 1.5B multilingual instruction model. Combines broad
multilingual comprehension across 29+ languages with strong coding and
math capabilities, well suited for interactive chat, summarization, and
cross-lingual translation.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_1_5B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_1_5B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_1_5B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN2_5_3B

> **QWEN2_5_3B**: `object` & `object`

Alibaba Qwen 2.5 3B high-capability multilingual model. Delivers strong
reasoning, coding, mathematics, and multilingual fluency across 29+
languages for in-depth text generation and complex multi-turn dialogue.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_3B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_3B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN2_5_3B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN3_0_6B

> **QWEN3_0_6B**: `object` & `object`

Alibaba Qwen 3 0.6B next-generation compact language model. Features
updated architectural optimizations for reduced latency, enhanced
multilingual token representation, and efficient conversational
turn-taking on mobile devices.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_0_6B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_0_6B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_0_6B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN3_1_7B

> **QWEN3_1_7B**: `object` & `object`

Alibaba Qwen 3 1.7B next-generation multilingual language model. Balances
high reasoning capability, general knowledge retrieval, coding
proficiency, and conversational fluidity across multiple languages.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_1_7B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_1_7B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_1_7B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.QWEN3_4B

> **QWEN3_4B**: `object` & `object`

Alibaba Qwen 3 4B high-capacity generative model. Delivers advanced
multi-step reasoning, comprehensive world knowledge, complex coding
capabilities, and top-tier multilingual performance for demanding
on-device AI applications.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_4B_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_4B_XNNPACK_8DA4W`

###### XNNPACK_BF16

> **XNNPACK_BF16**: [`LLMModel`](../type-aliases/LLMModel.md) = `QWEN3_4B_XNNPACK_BF16`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.SMOLLM2_1_7B

> **SMOLLM2_1_7B**: `object` & `object`

Hugging Face SmolLM2 1.7B language model trained on curated educational,
synthetic, and web data. Delivers competitive reasoning, creative text
generation, and general knowledge Q&A performance approaching larger
2B-3B models while maintaining fast on-device inference.

##### Type Declaration

###### MLX_INT8

> **MLX_INT8**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_1_7B_MLX_INT8`

###### XNNPACK_8DA8W

> **XNNPACK_8DA8W**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_1_7B_8DA8W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.SMOLLM2_135M

> **SMOLLM2_135M**: `object` & `object`

Hugging Face SmolLM2 135M ultra-compact language model. Engineered for
micro-memory footprints, instant token generation, text classification,
and background processing on low-power devices.

##### Type Declaration

###### MLX_INT8

> **MLX_INT8**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_135M_MLX_INT8`

###### XNNPACK_8DA8W

> **XNNPACK_8DA8W**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_135M_8DA8W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

#### llm.SMOLLM2_360M

> **SMOLLM2_360M**: `object` & `object`

Hugging Face SmolLM2 360M compact instruction-tuned model. Provides a
practical balance between fast mobile generation speed and conversational
coherence, ideal for lightweight on-device assistants, text
simplification, and structured data extraction.

##### Type Declaration

###### MLX_INT8

> **MLX_INT8**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_360M_MLX_INT8`

###### XNNPACK_8DA8W

> **XNNPACK_8DA8W**: [`LLMModel`](../type-aliases/LLMModel.md) = `SMOLLM2_360M_8DA8W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`LLMModel`](../type-aliases/LLMModel.md)

### objectDetection

> **objectDetection**: `object`

Object detection models that identify object locations and bounding boxes.

#### objectDetection.RFDETR_NANO

> **RFDETR_NANO**: `object` & `object`

RF-DETR (Roboflow Detection Transformer) Nano variant trained on COCO
(see [COCO_CLASSES](COCO_CLASSES.md)). Modern end-to-end DINOv2-based transformer
object detector.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `RFDETR_NANO_DETECTOR_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `RFDETR_NANO_DETECTOR_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

#### objectDetection.SSDLITE320_MOBILENET_V3_LARGE

> **SSDLITE320_MOBILENET_V3_LARGE**: `object` & `object`

SSDLite object detector with MobileNetV3-Large backbone trained on COCO
(see [COCO_CLASSES](COCO_CLASSES.md)) at 320x320 resolution. Fast, lightweight
detector suited for real-time mobile applications.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `SSDLITE320_MOBILENET_V3_LARGE_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `SSDLITE320_MOBILENET_V3_LARGE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"background"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"N/A"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

#### objectDetection.YOLO26

> **YOLO26**: `object` & `object`

Ultralytics YOLO26 real-time object detection models trained on COCO (80
classes, see [COCO_CLASSES_YOLO](COCO_CLASSES_YOLO.md)). Available across multiple scale
sizes (NANO, SMALL, MEDIUM, LARGE, XLARGE) and resolutions (384x384,
512x512, 640x640).

##### Type Declaration

###### LARGE

> **LARGE**: `object` & `object`

Large scale YOLO26 object detection model. High accuracy model variant.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_LARGE_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### MEDIUM

> **MEDIUM**: `object` & `object`

Medium scale YOLO26 object detection model. Higher precision for
complex scenes.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_MEDIUM_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### NANO

> **NANO**: `object` & `object`

Nano scale YOLO26 object detection model. High speed, ultra low
latency.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_NANO_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SMALL

> **SMALL**: `object` & `object`

Small scale YOLO26 object detection model. Balanced latency and
accuracy.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_SMALL_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### XLARGE

> **XLARGE**: `object` & `object`

Extra Large scale YOLO26 object detection model. Maximum detection
performance.

###### Type Declaration

###### SIZE_384

> **SIZE_384**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_384_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_384_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_512

> **SIZE_512**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_512_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_512_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### SIZE_640

> **SIZE_640**: `object` & `object`

###### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_640_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\> = `YOLO26_XLARGE_640_XNNPACK_FP32`

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

###### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`"xyxy"`, `"kite"` \| `"zebra"` \| `"parking meter"` \| `"toaster"` \| `"umbrella"` \| `"vase"` \| `"broccoli"` \| `"orange"` \| `"banana"` \| `"cup"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"dog"` \| `"horse"` \| `"person"` \| `"sheep"` \| `"train"` \| `"motorcycle"` \| `"airplane"` \| `"truck"` \| `"traffic light"` \| `"fire hydrant"` \| `"stop sign"` \| `"bench"` \| `"elephant"` \| `"bear"` \| `"giraffe"` \| `"backpack"` \| `"handbag"` \| `"tie"` \| `"suitcase"` \| `"frisbee"` \| `"skis"` \| `"snowboard"` \| `"sports ball"` \| `"baseball bat"` \| `"baseball glove"` \| `"skateboard"` \| `"surfboard"` \| `"tennis racket"` \| `"wine glass"` \| `"fork"` \| `"knife"` \| `"spoon"` \| `"bowl"` \| `"apple"` \| `"sandwich"` \| `"carrot"` \| `"hot dog"` \| `"pizza"` \| `"donut"` \| `"cake"` \| `"couch"` \| `"potted plant"` \| `"bed"` \| `"dining table"` \| `"toilet"` \| `"tv"` \| `"laptop"` \| `"mouse"` \| `"remote"` \| `"keyboard"` \| `"cell phone"` \| `"microwave"` \| `"oven"` \| `"sink"` \| `"refrigerator"` \| `"book"` \| `"clock"` \| `"scissors"` \| `"teddy bear"` \| `"hair drier"` \| `"toothbrush"`\>

### ocr

> **ocr**: `object`

Optical Character Recognition models — a text detector paired with a text
recognizer, run as one two-stage pipeline.

#### ocr.PADDLE

> **PADDLE**: `object`

PP-OCRv6 small — DBNet detector plus an SVTR recognizer, one model for
every language.

On Android, `VULKAN` is the faster choice.

#### ocr.PADDLE.PPOCRV6_SMALL

> **PPOCRV6_SMALL**: `object` & `object`

PP-OCRv6 Small multilingual OCR model.

##### Type Declaration

###### COREML

> **COREML**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md) = `PPOCRV6_SMALL_COREML_INT8`

###### VULKAN

> **VULKAN**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md) = `PPOCRV6_SMALL_VULKAN_FP16`

###### XNNPACK

> **XNNPACK**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md) = `PPOCRV6_SMALL_XNNPACK_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md) = `PPOCRV6_SMALL_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md)

### privacyFilter

> **privacyFilter**: `object`

Models that find and label personally identifiable information (PII) —
names, emails, phone numbers, addresses, and the like — in free text, so it
can be redacted or handled with care.

#### privacyFilter.NEMOTRON

> **NEMOTRON**: `object` & `object`

Nemotron-based detector covering 55 fine-grained PII types. Larger label
space for stricter compliance-oriented redaction.

##### Type Declaration

###### MLX_INT8

> **MLX_INT8**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"I-account_number"` \| `"E-account_number"` \| `"S-account_number"` \| `"B-language"` \| `"B-age"` \| `"B-api_key"` \| `"B-bank_routing_number"` \| `"B-biometric_identifier"` \| `"B-blood_type"` \| `"B-certificate_license_number"` \| `"B-city"` \| `"B-company_name"` \| `"B-coordinate"` \| `"B-country"` \| `"B-county"` \| `"B-credit_debit_card"` \| `"B-customer_id"` \| `"B-cvv"` \| `"B-date"` \| `"B-date_of_birth"` \| `"B-date_time"` \| `"B-device_identifier"` \| `"B-education_level"` \| `"B-email"` \| `"B-employee_id"` \| `"B-employment_status"` \| `"B-fax_number"` \| `"B-first_name"` \| `"B-gender"` \| `"B-health_plan_beneficiary_number"` \| `"B-http_cookie"` \| `"B-ipv4"` \| `"B-ipv6"` \| `"B-last_name"` \| `"B-license_plate"` \| `"B-mac_address"` \| `"B-medical_record_number"` \| `"B-national_id"` \| `"B-occupation"` \| `"B-password"` \| `"B-phone_number"` \| `"B-pin"` \| `"B-political_view"` \| `"B-postcode"` \| `"B-race_ethnicity"` \| `"B-religious_belief"` \| `"B-sexuality"` \| `"B-ssn"` \| `"B-state"` \| `"B-street_address"` \| `"B-swift_bic"` \| `"B-tax_id"` \| `"B-time"` \| `"B-unique_id"` \| `"B-url"` \| `"B-user_name"` \| `"B-vehicle_identifier"` \| `"I-language"` \| `"I-age"` \| `"I-api_key"` \| `"I-bank_routing_number"` \| `"I-biometric_identifier"` \| `"I-blood_type"` \| `"I-certificate_license_number"` \| `"I-city"` \| `"I-company_name"` \| `"I-coordinate"` \| `"I-country"` \| `"I-county"` \| `"I-credit_debit_card"` \| `"I-customer_id"` \| `"I-cvv"` \| `"I-date"` \| `"I-date_of_birth"` \| `"I-date_time"` \| `"I-device_identifier"` \| `"I-education_level"` \| `"I-email"` \| `"I-employee_id"` \| `"I-employment_status"` \| `"I-fax_number"` \| `"I-first_name"` \| `"I-gender"` \| `"I-health_plan_beneficiary_number"` \| `"I-http_cookie"` \| `"I-ipv4"` \| `"I-ipv6"` \| `"I-last_name"` \| `"I-license_plate"` \| `"I-mac_address"` \| `"I-medical_record_number"` \| `"I-national_id"` \| `"I-occupation"` \| `"I-password"` \| `"I-phone_number"` \| `"I-pin"` \| `"I-political_view"` \| `"I-postcode"` \| `"I-race_ethnicity"` \| `"I-religious_belief"` \| `"I-sexuality"` \| `"I-ssn"` \| `"I-state"` \| `"I-street_address"` \| `"I-swift_bic"` \| `"I-tax_id"` \| `"I-time"` \| `"I-unique_id"` \| `"I-url"` \| `"I-user_name"` \| `"I-vehicle_identifier"` \| `"E-language"` \| `"E-age"` \| `"E-api_key"` \| `"E-bank_routing_number"` \| `"E-biometric_identifier"` \| `"E-blood_type"` \| `"E-certificate_license_number"` \| `"E-city"` \| `"E-company_name"` \| `"E-coordinate"` \| `"E-country"` \| `"E-county"` \| `"E-credit_debit_card"` \| `"E-customer_id"` \| `"E-cvv"` \| `"E-date"` \| `"E-date_of_birth"` \| `"E-date_time"` \| `"E-device_identifier"` \| `"E-education_level"` \| `"E-email"` \| `"E-employee_id"` \| `"E-employment_status"` \| `"E-fax_number"` \| `"E-first_name"` \| `"E-gender"` \| `"E-health_plan_beneficiary_number"` \| `"E-http_cookie"` \| `"E-ipv4"` \| `"E-ipv6"` \| `"E-last_name"` \| `"E-license_plate"` \| `"E-mac_address"` \| `"E-medical_record_number"` \| `"E-national_id"` \| `"E-occupation"` \| `"E-password"` \| `"E-phone_number"` \| `"E-pin"` \| `"E-political_view"` \| `"E-postcode"` \| `"E-race_ethnicity"` \| `"E-religious_belief"` \| `"E-sexuality"` \| `"E-ssn"` \| `"E-state"` \| `"E-street_address"` \| `"E-swift_bic"` \| `"E-tax_id"` \| `"E-time"` \| `"E-unique_id"` \| `"E-url"` \| `"E-user_name"` \| `"E-vehicle_identifier"` \| `"S-language"` \| `"S-age"` \| `"S-api_key"` \| `"S-bank_routing_number"` \| `"S-biometric_identifier"` \| `"S-blood_type"` \| `"S-certificate_license_number"` \| `"S-city"` \| `"S-company_name"` \| `"S-coordinate"` \| `"S-country"` \| `"S-county"` \| `"S-credit_debit_card"` \| `"S-customer_id"` \| `"S-cvv"` \| `"S-date"` \| `"S-date_of_birth"` \| `"S-date_time"` \| `"S-device_identifier"` \| `"S-education_level"` \| `"S-email"` \| `"S-employee_id"` \| `"S-employment_status"` \| `"S-fax_number"` \| `"S-first_name"` \| `"S-gender"` \| `"S-health_plan_beneficiary_number"` \| `"S-http_cookie"` \| `"S-ipv4"` \| `"S-ipv6"` \| `"S-last_name"` \| `"S-license_plate"` \| `"S-mac_address"` \| `"S-medical_record_number"` \| `"S-national_id"` \| `"S-occupation"` \| `"S-password"` \| `"S-phone_number"` \| `"S-pin"` \| `"S-political_view"` \| `"S-postcode"` \| `"S-race_ethnicity"` \| `"S-religious_belief"` \| `"S-sexuality"` \| `"S-ssn"` \| `"S-state"` \| `"S-street_address"` \| `"S-swift_bic"` \| `"S-tax_id"` \| `"S-time"` \| `"S-unique_id"` \| `"S-url"` \| `"S-user_name"` \| `"S-vehicle_identifier"`\> = `PRIVACY_FILTER_NEMOTRON_MLX_INT8`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"I-account_number"` \| `"E-account_number"` \| `"S-account_number"` \| `"B-language"` \| `"B-age"` \| `"B-api_key"` \| `"B-bank_routing_number"` \| `"B-biometric_identifier"` \| `"B-blood_type"` \| `"B-certificate_license_number"` \| `"B-city"` \| `"B-company_name"` \| `"B-coordinate"` \| `"B-country"` \| `"B-county"` \| `"B-credit_debit_card"` \| `"B-customer_id"` \| `"B-cvv"` \| `"B-date"` \| `"B-date_of_birth"` \| `"B-date_time"` \| `"B-device_identifier"` \| `"B-education_level"` \| `"B-email"` \| `"B-employee_id"` \| `"B-employment_status"` \| `"B-fax_number"` \| `"B-first_name"` \| `"B-gender"` \| `"B-health_plan_beneficiary_number"` \| `"B-http_cookie"` \| `"B-ipv4"` \| `"B-ipv6"` \| `"B-last_name"` \| `"B-license_plate"` \| `"B-mac_address"` \| `"B-medical_record_number"` \| `"B-national_id"` \| `"B-occupation"` \| `"B-password"` \| `"B-phone_number"` \| `"B-pin"` \| `"B-political_view"` \| `"B-postcode"` \| `"B-race_ethnicity"` \| `"B-religious_belief"` \| `"B-sexuality"` \| `"B-ssn"` \| `"B-state"` \| `"B-street_address"` \| `"B-swift_bic"` \| `"B-tax_id"` \| `"B-time"` \| `"B-unique_id"` \| `"B-url"` \| `"B-user_name"` \| `"B-vehicle_identifier"` \| `"I-language"` \| `"I-age"` \| `"I-api_key"` \| `"I-bank_routing_number"` \| `"I-biometric_identifier"` \| `"I-blood_type"` \| `"I-certificate_license_number"` \| `"I-city"` \| `"I-company_name"` \| `"I-coordinate"` \| `"I-country"` \| `"I-county"` \| `"I-credit_debit_card"` \| `"I-customer_id"` \| `"I-cvv"` \| `"I-date"` \| `"I-date_of_birth"` \| `"I-date_time"` \| `"I-device_identifier"` \| `"I-education_level"` \| `"I-email"` \| `"I-employee_id"` \| `"I-employment_status"` \| `"I-fax_number"` \| `"I-first_name"` \| `"I-gender"` \| `"I-health_plan_beneficiary_number"` \| `"I-http_cookie"` \| `"I-ipv4"` \| `"I-ipv6"` \| `"I-last_name"` \| `"I-license_plate"` \| `"I-mac_address"` \| `"I-medical_record_number"` \| `"I-national_id"` \| `"I-occupation"` \| `"I-password"` \| `"I-phone_number"` \| `"I-pin"` \| `"I-political_view"` \| `"I-postcode"` \| `"I-race_ethnicity"` \| `"I-religious_belief"` \| `"I-sexuality"` \| `"I-ssn"` \| `"I-state"` \| `"I-street_address"` \| `"I-swift_bic"` \| `"I-tax_id"` \| `"I-time"` \| `"I-unique_id"` \| `"I-url"` \| `"I-user_name"` \| `"I-vehicle_identifier"` \| `"E-language"` \| `"E-age"` \| `"E-api_key"` \| `"E-bank_routing_number"` \| `"E-biometric_identifier"` \| `"E-blood_type"` \| `"E-certificate_license_number"` \| `"E-city"` \| `"E-company_name"` \| `"E-coordinate"` \| `"E-country"` \| `"E-county"` \| `"E-credit_debit_card"` \| `"E-customer_id"` \| `"E-cvv"` \| `"E-date"` \| `"E-date_of_birth"` \| `"E-date_time"` \| `"E-device_identifier"` \| `"E-education_level"` \| `"E-email"` \| `"E-employee_id"` \| `"E-employment_status"` \| `"E-fax_number"` \| `"E-first_name"` \| `"E-gender"` \| `"E-health_plan_beneficiary_number"` \| `"E-http_cookie"` \| `"E-ipv4"` \| `"E-ipv6"` \| `"E-last_name"` \| `"E-license_plate"` \| `"E-mac_address"` \| `"E-medical_record_number"` \| `"E-national_id"` \| `"E-occupation"` \| `"E-password"` \| `"E-phone_number"` \| `"E-pin"` \| `"E-political_view"` \| `"E-postcode"` \| `"E-race_ethnicity"` \| `"E-religious_belief"` \| `"E-sexuality"` \| `"E-ssn"` \| `"E-state"` \| `"E-street_address"` \| `"E-swift_bic"` \| `"E-tax_id"` \| `"E-time"` \| `"E-unique_id"` \| `"E-url"` \| `"E-user_name"` \| `"E-vehicle_identifier"` \| `"S-language"` \| `"S-age"` \| `"S-api_key"` \| `"S-bank_routing_number"` \| `"S-biometric_identifier"` \| `"S-blood_type"` \| `"S-certificate_license_number"` \| `"S-city"` \| `"S-company_name"` \| `"S-coordinate"` \| `"S-country"` \| `"S-county"` \| `"S-credit_debit_card"` \| `"S-customer_id"` \| `"S-cvv"` \| `"S-date"` \| `"S-date_of_birth"` \| `"S-date_time"` \| `"S-device_identifier"` \| `"S-education_level"` \| `"S-email"` \| `"S-employee_id"` \| `"S-employment_status"` \| `"S-fax_number"` \| `"S-first_name"` \| `"S-gender"` \| `"S-health_plan_beneficiary_number"` \| `"S-http_cookie"` \| `"S-ipv4"` \| `"S-ipv6"` \| `"S-last_name"` \| `"S-license_plate"` \| `"S-mac_address"` \| `"S-medical_record_number"` \| `"S-national_id"` \| `"S-occupation"` \| `"S-password"` \| `"S-phone_number"` \| `"S-pin"` \| `"S-political_view"` \| `"S-postcode"` \| `"S-race_ethnicity"` \| `"S-religious_belief"` \| `"S-sexuality"` \| `"S-ssn"` \| `"S-state"` \| `"S-street_address"` \| `"S-swift_bic"` \| `"S-tax_id"` \| `"S-time"` \| `"S-unique_id"` \| `"S-url"` \| `"S-user_name"` \| `"S-vehicle_identifier"`\> = `PRIVACY_FILTER_NEMOTRON_XNNPACK_8DA4W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"I-account_number"` \| `"E-account_number"` \| `"S-account_number"` \| `"B-language"` \| `"B-age"` \| `"B-api_key"` \| `"B-bank_routing_number"` \| `"B-biometric_identifier"` \| `"B-blood_type"` \| `"B-certificate_license_number"` \| `"B-city"` \| `"B-company_name"` \| `"B-coordinate"` \| `"B-country"` \| `"B-county"` \| `"B-credit_debit_card"` \| `"B-customer_id"` \| `"B-cvv"` \| `"B-date"` \| `"B-date_of_birth"` \| `"B-date_time"` \| `"B-device_identifier"` \| `"B-education_level"` \| `"B-email"` \| `"B-employee_id"` \| `"B-employment_status"` \| `"B-fax_number"` \| `"B-first_name"` \| `"B-gender"` \| `"B-health_plan_beneficiary_number"` \| `"B-http_cookie"` \| `"B-ipv4"` \| `"B-ipv6"` \| `"B-last_name"` \| `"B-license_plate"` \| `"B-mac_address"` \| `"B-medical_record_number"` \| `"B-national_id"` \| `"B-occupation"` \| `"B-password"` \| `"B-phone_number"` \| `"B-pin"` \| `"B-political_view"` \| `"B-postcode"` \| `"B-race_ethnicity"` \| `"B-religious_belief"` \| `"B-sexuality"` \| `"B-ssn"` \| `"B-state"` \| `"B-street_address"` \| `"B-swift_bic"` \| `"B-tax_id"` \| `"B-time"` \| `"B-unique_id"` \| `"B-url"` \| `"B-user_name"` \| `"B-vehicle_identifier"` \| `"I-language"` \| `"I-age"` \| `"I-api_key"` \| `"I-bank_routing_number"` \| `"I-biometric_identifier"` \| `"I-blood_type"` \| `"I-certificate_license_number"` \| `"I-city"` \| `"I-company_name"` \| `"I-coordinate"` \| `"I-country"` \| `"I-county"` \| `"I-credit_debit_card"` \| `"I-customer_id"` \| `"I-cvv"` \| `"I-date"` \| `"I-date_of_birth"` \| `"I-date_time"` \| `"I-device_identifier"` \| `"I-education_level"` \| `"I-email"` \| `"I-employee_id"` \| `"I-employment_status"` \| `"I-fax_number"` \| `"I-first_name"` \| `"I-gender"` \| `"I-health_plan_beneficiary_number"` \| `"I-http_cookie"` \| `"I-ipv4"` \| `"I-ipv6"` \| `"I-last_name"` \| `"I-license_plate"` \| `"I-mac_address"` \| `"I-medical_record_number"` \| `"I-national_id"` \| `"I-occupation"` \| `"I-password"` \| `"I-phone_number"` \| `"I-pin"` \| `"I-political_view"` \| `"I-postcode"` \| `"I-race_ethnicity"` \| `"I-religious_belief"` \| `"I-sexuality"` \| `"I-ssn"` \| `"I-state"` \| `"I-street_address"` \| `"I-swift_bic"` \| `"I-tax_id"` \| `"I-time"` \| `"I-unique_id"` \| `"I-url"` \| `"I-user_name"` \| `"I-vehicle_identifier"` \| `"E-language"` \| `"E-age"` \| `"E-api_key"` \| `"E-bank_routing_number"` \| `"E-biometric_identifier"` \| `"E-blood_type"` \| `"E-certificate_license_number"` \| `"E-city"` \| `"E-company_name"` \| `"E-coordinate"` \| `"E-country"` \| `"E-county"` \| `"E-credit_debit_card"` \| `"E-customer_id"` \| `"E-cvv"` \| `"E-date"` \| `"E-date_of_birth"` \| `"E-date_time"` \| `"E-device_identifier"` \| `"E-education_level"` \| `"E-email"` \| `"E-employee_id"` \| `"E-employment_status"` \| `"E-fax_number"` \| `"E-first_name"` \| `"E-gender"` \| `"E-health_plan_beneficiary_number"` \| `"E-http_cookie"` \| `"E-ipv4"` \| `"E-ipv6"` \| `"E-last_name"` \| `"E-license_plate"` \| `"E-mac_address"` \| `"E-medical_record_number"` \| `"E-national_id"` \| `"E-occupation"` \| `"E-password"` \| `"E-phone_number"` \| `"E-pin"` \| `"E-political_view"` \| `"E-postcode"` \| `"E-race_ethnicity"` \| `"E-religious_belief"` \| `"E-sexuality"` \| `"E-ssn"` \| `"E-state"` \| `"E-street_address"` \| `"E-swift_bic"` \| `"E-tax_id"` \| `"E-time"` \| `"E-unique_id"` \| `"E-url"` \| `"E-user_name"` \| `"E-vehicle_identifier"` \| `"S-language"` \| `"S-age"` \| `"S-api_key"` \| `"S-bank_routing_number"` \| `"S-biometric_identifier"` \| `"S-blood_type"` \| `"S-certificate_license_number"` \| `"S-city"` \| `"S-company_name"` \| `"S-coordinate"` \| `"S-country"` \| `"S-county"` \| `"S-credit_debit_card"` \| `"S-customer_id"` \| `"S-cvv"` \| `"S-date"` \| `"S-date_of_birth"` \| `"S-date_time"` \| `"S-device_identifier"` \| `"S-education_level"` \| `"S-email"` \| `"S-employee_id"` \| `"S-employment_status"` \| `"S-fax_number"` \| `"S-first_name"` \| `"S-gender"` \| `"S-health_plan_beneficiary_number"` \| `"S-http_cookie"` \| `"S-ipv4"` \| `"S-ipv6"` \| `"S-last_name"` \| `"S-license_plate"` \| `"S-mac_address"` \| `"S-medical_record_number"` \| `"S-national_id"` \| `"S-occupation"` \| `"S-password"` \| `"S-phone_number"` \| `"S-pin"` \| `"S-political_view"` \| `"S-postcode"` \| `"S-race_ethnicity"` \| `"S-religious_belief"` \| `"S-sexuality"` \| `"S-ssn"` \| `"S-state"` \| `"S-street_address"` \| `"S-swift_bic"` \| `"S-tax_id"` \| `"S-time"` \| `"S-unique_id"` \| `"S-url"` \| `"S-user_name"` \| `"S-vehicle_identifier"`\>

#### privacyFilter.OPENAI

> **OPENAI**: `object` & `object`

OpenAI-style detector covering 8 common PII types (name, email, phone,
address, and similar). Compact label space, best for general redaction.

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"B-private_address"` \| `"B-private_date"` \| `"B-private_email"` \| `"B-private_person"` \| `"B-private_phone"` \| `"B-private_url"` \| `"B-secret"` \| `"I-account_number"` \| `"I-private_address"` \| `"I-private_date"` \| `"I-private_email"` \| `"I-private_person"` \| `"I-private_phone"` \| `"I-private_url"` \| `"I-secret"` \| `"E-account_number"` \| `"E-private_address"` \| `"E-private_date"` \| `"E-private_email"` \| `"E-private_person"` \| `"E-private_phone"` \| `"E-private_url"` \| `"E-secret"` \| `"S-account_number"` \| `"S-private_address"` \| `"S-private_date"` \| `"S-private_email"` \| `"S-private_person"` \| `"S-private_phone"` \| `"S-private_url"` \| `"S-secret"`\> = `PRIVACY_FILTER_OPENAI_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"B-private_address"` \| `"B-private_date"` \| `"B-private_email"` \| `"B-private_person"` \| `"B-private_phone"` \| `"B-private_url"` \| `"B-secret"` \| `"I-account_number"` \| `"I-private_address"` \| `"I-private_date"` \| `"I-private_email"` \| `"I-private_person"` \| `"I-private_phone"` \| `"I-private_url"` \| `"I-secret"` \| `"E-account_number"` \| `"E-private_address"` \| `"E-private_date"` \| `"E-private_email"` \| `"E-private_person"` \| `"E-private_phone"` \| `"E-private_url"` \| `"E-secret"` \| `"S-account_number"` \| `"S-private_address"` \| `"S-private_date"` \| `"S-private_email"` \| `"S-private_person"` \| `"S-private_phone"` \| `"S-private_url"` \| `"S-secret"`\> = `PRIVACY_FILTER_OPENAI_XNNPACK_8DA4W`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`"O"` \| `"B-account_number"` \| `"B-private_address"` \| `"B-private_date"` \| `"B-private_email"` \| `"B-private_person"` \| `"B-private_phone"` \| `"B-private_url"` \| `"B-secret"` \| `"I-account_number"` \| `"I-private_address"` \| `"I-private_date"` \| `"I-private_email"` \| `"I-private_person"` \| `"I-private_phone"` \| `"I-private_url"` \| `"I-secret"` \| `"E-account_number"` \| `"E-private_address"` \| `"E-private_date"` \| `"E-private_email"` \| `"E-private_person"` \| `"E-private_phone"` \| `"E-private_url"` \| `"E-secret"` \| `"S-account_number"` \| `"S-private_address"` \| `"S-private_date"` \| `"S-private_email"` \| `"S-private_person"` \| `"S-private_phone"` \| `"S-private_url"` \| `"S-secret"`\>

### semanticSegmentation

> **semanticSegmentation**: `object`

Semantic segmentation models that classify each pixel into target object or
background classes.

#### semanticSegmentation.DEEPLAB_V3_MOBILENET_V3_LARGE

> **DEEPLAB_V3_MOBILENET_V3_LARGE**: `object` & `object`

DeepLabV3 semantic segmentation model with MobileNetV3-Large backbone (21
classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)). Combines DeepLabV3 feature
extraction quality with a lightweight mobile backbone.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_MOBILENET_V3_LARGE_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_MOBILENET_V3_LARGE_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.DEEPLAB_V3_RESNET101

> **DEEPLAB_V3_RESNET101**: `object` & `object`

DeepLabV3 semantic segmentation model with ResNet-101 backbone (21
classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)). High-capacity backbone for
maximum segmentation detail and boundary accuracy.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET101_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET101_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET101_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.DEEPLAB_V3_RESNET50

> **DEEPLAB_V3_RESNET50**: `object` & `object`

DeepLabV3 semantic segmentation model with ResNet-50 backbone (21
classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)). High-accuracy segmentation
utilizing atrous spatial pyramid pooling.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET50_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET50_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `DEEPLAB_V3_RESNET50_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.FCN_RESNET101

> **FCN_RESNET101**: `object` & `object`

Fully Convolutional Network (FCN) semantic segmentation model with
ResNet-101 backbone (21 classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)).

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET101_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET101_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET101_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.FCN_RESNET50

> **FCN_RESNET50**: `object` & `object`

Fully Convolutional Network (FCN) semantic segmentation model with
ResNet-50 backbone (21 classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)).

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET50_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET50_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `FCN_RESNET50_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.LRASPP_MOBILENET_V3_LARGE

> **LRASPP_MOBILENET_V3_LARGE**: `object` & `object`

Lite R-ASPP semantic segmentation model with MobileNetV3-Large backbone
(21 classes, see [PASCAL_VOC_LABELS](PASCAL_VOC_LABELS.md)). Optimized for low-latency,
real-time pixel-level segmentation on mobile devices.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `LRASPP_MOBILENET_V3_LARGE_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `LRASPP_MOBILENET_V3_LARGE_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\> = `LRASPP_MOBILENET_V3_LARGE_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"aeroplane"` \| `"bicycle"` \| `"bird"` \| `"boat"` \| `"bottle"` \| `"bus"` \| `"car"` \| `"cat"` \| `"chair"` \| `"cow"` \| `"diningtable"` \| `"dog"` \| `"horse"` \| `"motorbike"` \| `"person"` \| `"pottedplant"` \| `"sheep"` \| `"sofa"` \| `"train"` \| `"tvmonitor"`\>

#### semanticSegmentation.SELFIE_SEGMENTATION

> **SELFIE_SEGMENTATION**: `object` & `object`

Lightweight portrait selfie segmentation model for real-time person vs
background separation. Categorizes pixels into `background` and `person`.
Ideal for background blur and replacement effects.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\> = `SELFIE_SEGMENTATION_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\> = `SELFIE_SEGMENTATION_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\>

#### semanticSegmentation.SELFIE_SEGMENTATION_LANDSCAPE

> **SELFIE_SEGMENTATION_LANDSCAPE**: `object` & `object`

MediaPipe Selfie Segmentation, landscape orientation. A separate
256x144 checkpoint rather than a resize of the portrait model.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\> = `SELFIE_SEGMENTATION_LANDSCAPE_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\> = `SELFIE_SEGMENTATION_LANDSCAPE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`"background"` \| `"person"`\>

### speechToText

> **speechToText**: `object`

Automatic Speech Recognition (ASR) / Speech-to-Text models.

#### speechToText.WHISPER

> **WHISPER**: `object`

OpenAI Whisper automatic speech recognition model family with integrated
Voice Activity Detection. Includes multilingual and English-only (`EN`)
variants across model sizes (`TINY`, `BASE`, `SMALL`).

#### speechToText.WHISPER.BASE

> **BASE**: `object` & `object`

Multilingual Whisper Base model. Higher accuracy across supported
languages.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_COREML_FP16`

###### MLX_BF16

> **MLX_BF16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_MLX_BF16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_BASE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)

#### speechToText.WHISPER.EN

> **EN**: `object`

English-only optimized Whisper models (`TINY`, `BASE`, `SMALL`).

#### speechToText.WHISPER.EN.BASE

> **BASE**: `object` & `object`

English-only Whisper Base model. High accuracy English speech
recognition.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_COREML_FP16`

###### MLX_BF16

> **MLX_BF16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_MLX_BF16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_BASE_EN_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\>

#### speechToText.WHISPER.EN.SMALL

> **SMALL**: `object` & `object`

English-only Whisper Small model. Superior accuracy for English
transcription.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_COREML_FP16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_SMALL_EN_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\>

#### speechToText.WHISPER.EN.TINY

> **TINY**: `object` & `object`

English-only Whisper Tiny model. Fast and compact for English STT.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_COREML_FP16`

###### MLX_BF16

> **MLX_BF16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_MLX_BF16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\> = `WHISPER_TINY_EN_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`"en"`\>

#### speechToText.WHISPER.SMALL

> **SMALL**: `object` & `object`

Multilingual Whisper Small model. Best accuracy for complex
multi-language audio.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_SMALL_COREML_FP16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_SMALL_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_SMALL_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_SMALL_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_SMALL_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)

#### speechToText.WHISPER.TINY

> **TINY**: `object` & `object`

Multilingual Whisper Tiny model. Supporting 99+ languages. High speed
speech recognition.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_COREML_FP16`

###### MLX_BF16

> **MLX_BF16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_MLX_BF16`

###### MLX_INT8

> **MLX_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md) = `WHISPER_TINY_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)

### styleTransfer

> **styleTransfer**: `object`

Artistic style transfer models that re-style input images according to
artwork patterns.

#### styleTransfer.CANDY

> **CANDY**: `object` & `object`

Fast neural style transfer model generating a vibrant, artistic "Candy"
style effect.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_CANDY_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_CANDY_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_CANDY_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

#### styleTransfer.MOSAIC

> **MOSAIC**: `object` & `object`

Fast neural style transfer model applying a classic tile mosaic artistic
pattern.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_MOSAIC_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_MOSAIC_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_MOSAIC_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

#### styleTransfer.RAIN_PRINCESS

> **RAIN_PRINCESS**: `object` & `object`

Fast neural style transfer model applying a painterly "Rain Princess" oil
painting aesthetic.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_RAIN_PRINCESS_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_RAIN_PRINCESS_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

#### styleTransfer.UDNIE

> **UDNIE**: `object` & `object`

Fast neural style transfer model applying Francis Picabia's "Udnie"
abstract art style.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_UDNIE_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_UDNIE_XNNPACK_FP32`

###### XNNPACK_INT8

> **XNNPACK_INT8**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) = `STYLE_TRANSFER_UDNIE_XNNPACK_INT8`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

### textEmbeddings

> **textEmbeddings**: `object`

Text embedding models mapping sentences and documents into dense vector
representations for semantic search and RAG.

#### textEmbeddings.ALL_MINILM_L6_V2

> **ALL_MINILM_L6_V2**: `object` & `object`

Compact 384-dimensional sentence transformer mapping text to a dense
vector space. Optimized for fast, general-purpose semantic search,
sentence similarity, and clustering.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MINILM_L6_V2_COREML_FP16`

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MINILM_L6_V2_VULKAN_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MINILM_L6_V2_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.ALL_MPNET_BASE_V2

> **ALL_MPNET_BASE_V2**: `object` & `object`

High-quality 768-dimensional sentence transformer model based on MPNet.
Provides higher quality semantic embeddings compared to MiniLM.

##### Type Declaration

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MPNET_BASE_V2_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MPNET_BASE_V2_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `ALL_MPNET_BASE_V2_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT

> **CLIP_VIT_BASE_PATCH32_TEXT**: `object` & `object`

CLIP text encoder (ViT-B/32) mapping text queries into a 512-dimensional
joint text-image embedding space. Used in combination with
`imageEmbeddings.CLIP_VIT_BASE_PATCH32` for zero-shot text-to-image
search.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_TEXT_COREML_FP16`

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_TEXT_VULKAN_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `CLIP_VIT_BASE_PATCH32_TEXT_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.DISTILUSE_BASE_MULTILINGUAL_CASED_V2

> **DISTILUSE_BASE_MULTILINGUAL_CASED_V2**: `object` & `object`

Multilingual sentence transformer supporting 50+ languages, based on
distilled Universal Sentence Encoder (512-dim output).

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `DISTILUSE_BASE_MULTILINGUAL_CASED_V2_COREML_FP16`

###### MLX_INT8

> **MLX_INT8**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `DISTILUSE_BASE_MULTILINGUAL_CASED_V2_MLX_INT8`

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `DISTILUSE_BASE_MULTILINGUAL_CASED_V2_VULKAN_FP16`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `DISTILUSE_BASE_MULTILINGUAL_CASED_V2_EMBEDDINGS`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `DISTILUSE_BASE_MULTILINGUAL_CASED_V2_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.LFM2_5_EMBEDDING_350M

> **LFM2_5_EMBEDDING_350M**: `object` & `object`

Liquid AI LFM 2.5 350M parameter embedding model for asymmetric search
and retrieval tasks. Prompts queries with `query: ` (the default) and
passages with `document: ` via [TextEmbedder.embed](../type-aliases/TextEmbedder.md#embed).

##### Type Declaration

###### MLX_INT4

> **MLX_INT4**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `LFM2_5_EMBEDDING_350M_MLX_INT4`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `LFM2_5_EMBEDDING_350M_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.MULTI_QA_MINILM_L6_COS_V1

> **MULTI_QA_MINILM_L6_COS_V1**: `object` & `object`

384-dimensional sentence transformer fine-tuned specifically for semantic
QA matching using cosine similarity.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MINILM_L6_COS_V1_COREML_FP16`

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MINILM_L6_COS_V1_VULKAN_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MINILM_L6_COS_V1_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.MULTI_QA_MPNET_BASE_DOT_V1

> **MULTI_QA_MPNET_BASE_DOT_V1**: `object` & `object`

768-dimensional sentence transformer fine-tuned specifically for
question-answering matching using dot product distance.

##### Type Declaration

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_FP16`

###### VULKAN_INT8

> **VULKAN_INT8**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MPNET_BASE_DOT_V1_VULKAN_INT8`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `MULTI_QA_MPNET_BASE_DOT_V1_EMBEDDINGS`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

#### textEmbeddings.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2

> **PARAPHRASE_MULTILINGUAL_MINILM_L12_V2**: `object` & `object`

384-dimensional sentence transformer supporting 50+ languages for
cross-lingual semantic similarity.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_COREML_FP16`

###### VULKAN_FP16

> **VULKAN_FP16**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_VULKAN_FP16`

###### XNNPACK_8DA4W

> **XNNPACK_8DA4W**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_EMBEDDINGS`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) = `PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

### textToImage

> **textToImage**: `object`

Generative text-to-image synthesis models.

#### textToImage.SDXS_512_DREAMSHAPER

> **SDXS_512_DREAMSHAPER**: `object` & `object`

Ultra-fast SDXS (Stable Diffusion eXtreme Speed) 512x512 text-to-image
generation model based on DreamShaper. Generates high-quality images from
text prompts in real time.

##### Type Declaration

###### COREML_FP16

> **COREML_FP16**: [`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md) = `SDXS_512_DREAMSHAPER_COREML_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md) = `SDXS_512_DREAMSHAPER_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md)

### textToSpeech

> **textToSpeech**: `object`

Text-to-Speech (TTS) models that synthesize audio waveforms from input
text.

#### textToSpeech.KOKORO

> **KOKORO**: `object`

Kokoro — a lightweight phoneme-driven Text-to-Speech model. Each language
entry bundles the matching model weights, grapheme-to-phoneme assets and
the voices available for that language, nested per backend.

#### textToSpeech.KOKORO.DE

> **DE**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"df_anna"`\> = `KOKORO_DE_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"df_anna"`\> = `KOKORO_DE_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"df_anna"`\>

#### textToSpeech.KOKORO.EN_GB

> **EN_GB**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"bf_emma"` \| `"bm_daniel"`\> = `KOKORO_EN_GB_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"bf_emma"` \| `"bm_daniel"`\> = `KOKORO_EN_GB_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"bf_emma"` \| `"bm_daniel"`\>

#### textToSpeech.KOKORO.EN_US

> **EN_US**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"af_heart"` \| `"af_river"` \| `"af_sarah"` \| `"am_adam"` \| `"am_michael"` \| `"am_santa"`\> = `KOKORO_EN_US_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"af_heart"` \| `"af_river"` \| `"af_sarah"` \| `"am_adam"` \| `"am_michael"` \| `"am_santa"`\> = `KOKORO_EN_US_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"af_heart"` \| `"af_river"` \| `"af_sarah"` \| `"am_adam"` \| `"am_michael"` \| `"am_santa"`\>

#### textToSpeech.KOKORO.ES

> **ES**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ef_dora"` \| `"em_alex"`\> = `KOKORO_ES_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ef_dora"` \| `"em_alex"`\> = `KOKORO_ES_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ef_dora"` \| `"em_alex"`\>

#### textToSpeech.KOKORO.FR

> **FR**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ff_siwis"`\> = `KOKORO_FR_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ff_siwis"`\> = `KOKORO_FR_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"ff_siwis"`\>

#### textToSpeech.KOKORO.HI

> **HI**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"hf_alpha"` \| `"hm_omega"` \| `"hm_psi"`\> = `KOKORO_HI_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"hf_alpha"` \| `"hm_omega"` \| `"hm_psi"`\> = `KOKORO_HI_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"hf_alpha"` \| `"hm_omega"` \| `"hm_psi"`\>

#### textToSpeech.KOKORO.IT

> **IT**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"if_sara"` \| `"im_nicola"`\> = `KOKORO_IT_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"if_sara"` \| `"im_nicola"`\> = `KOKORO_IT_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"if_sara"` \| `"im_nicola"`\>

#### textToSpeech.KOKORO.PL

> **PL**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pm_mateusz"`\> = `KOKORO_PL_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pm_mateusz"`\> = `KOKORO_PL_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pm_mateusz"`\>

#### textToSpeech.KOKORO.PT

> **PT**: `object` & `object`

##### Type Declaration

###### COREML_FP32

> **COREML_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pf_dora"` \| `"pm_santa"`\> = `KOKORO_PT_COREML_FP32`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pf_dora"` \| `"pm_santa"`\> = `KOKORO_PT_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`"pf_dora"` \| `"pm_santa"`\>

#### textToSpeech.SUPERTONIC

> **SUPERTONIC**: `object` & `object`

Supertonic 3 multilingual flow-matching Text-to-Speech model. Delivers
natural, highly expressive speech synthesis with configurable speaker
voice presets (see [SUPERTONIC_DEFAULT_VOICE_NAMES](SUPERTONIC_DEFAULT_VOICE_NAMES.md)).

##### Type Declaration

###### MLX_FP32

> **MLX_FP32**: [`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`"F1"` \| `"F2"` \| `"F3"` \| `"F4"` \| `"F5"` \| `"M1"` \| `"M2"` \| `"M3"` \| `"M4"` \| `"M5"`\> = `SUPERTONIC_3_MLX_FP32`

###### VULKAN_FP16

> **VULKAN_FP16**: [`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`"F1"` \| `"F2"` \| `"F3"` \| `"F4"` \| `"F5"` \| `"M1"` \| `"M2"` \| `"M3"` \| `"M4"` \| `"M5"`\> = `SUPERTONIC_3_VULKAN_FP16`

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`"F1"` \| `"F2"` \| `"F3"` \| `"F4"` \| `"F5"` \| `"M1"` \| `"M2"` \| `"M3"` \| `"M4"` \| `"M5"`\> = `SUPERTONIC_3_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`"F1"` \| `"F2"` \| `"F3"` \| `"F4"` \| `"F5"` \| `"M1"` \| `"M2"` \| `"M3"` \| `"M4"` \| `"M5"`\>

### tokenizer

> **tokenizer**: `object`

Standalone text tokenizers for preprocessing strings into token ID arrays.

#### tokenizer.ALL_MINILM_L6_V2

> **ALL_MINILM_L6_V2**: `string` = `ALL_MINILM_L6_V2_TOKENIZER`

WordPiece tokenizer URL for the `all-MiniLM-L6-v2` embedding model.

### voiceActivityDetection

> **voiceActivityDetection**: `object`

Voice Activity Detection (VAD) models detecting speech vs non-speech
intervals in real-time audio streams.

#### voiceActivityDetection.FSMN_VAD

> **FSMN_VAD**: `object` & `object`

Feedforward Sequential Memory Network (FSMN) Voice Activity Detection
model. Extremely lightweight model evaluating continuous speech
probability chunks for live mic streaming and STT preprocessing.

##### Type Declaration

###### XNNPACK_FP32

> **XNNPACK_FP32**: [`FsmnVadModel`](../type-aliases/FsmnVadModel.md) = `FSMN_VAD_XNNPACK_FP32`

##### Type Declaration

###### DEFAULT

> `readonly` **DEFAULT**: [`FsmnVadModel`](../type-aliases/FsmnVadModel.md)
