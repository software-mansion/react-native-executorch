#include <executorch/extension/module/module.h>

class Model {
 public:
  explicit Model(
                 const std::string& file_path);

  void forward();
 private:
  std::unique_ptr<::executorch::extension::Module> module_;
};
