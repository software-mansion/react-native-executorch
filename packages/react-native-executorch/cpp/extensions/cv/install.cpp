#include "install.h"
#include "box_ops.h"
#include "image_ops.h"
#include "ocr_ops.h"

namespace rnexecutorch::extensions::cv {
namespace jsi = facebook::jsi;

void install(facebook::jsi::Runtime &rt, facebook::jsi::Object &module) {
    jsi::Object cvModule = jsi::Object(rt);

    image_ops::install_resize(rt, cvModule);
    image_ops::install_cvtColor(rt, cvModule);
    image_ops::install_toChannelsFirst(rt, cvModule);
    image_ops::install_toChannelsLast(rt, cvModule);
    image_ops::install_normalize(rt, cvModule);
    image_ops::install_applyColormap(rt, cvModule);
    image_ops::install_rotate(rt, cvModule);
    image_ops::install_warpByGrid(rt, cvModule);
    image_ops::install_warpQuad(rt, cvModule);

    box_ops::install_nms(rt, cvModule);
    box_ops::install_restrictToBox(rt, cvModule);

    ocr_ops::install_extractCraftTextBoxes(rt, cvModule);
    ocr_ops::install_extractDbnetTextBoxes(rt, cvModule);
    ocr_ops::install_ctcGreedyDecode(rt, cvModule);

    module.setProperty(rt, "cv", cvModule);
}
} // namespace rnexecutorch::extensions::cv
