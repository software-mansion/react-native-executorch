#include "Model.h"

#include <executorch/extension/module/module.h>

using ::executorch::extension::Module;

Model::Model(
             const std::string& file_path
             ){
  module_ = std::make_unique<Module>(file_path);
}

void Model::forward(){
  return;
}
