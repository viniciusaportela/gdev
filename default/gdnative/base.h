#ifndef BASE_H
#define BASE_H

#include <Godot.hpp>
#include <Node.hpp>

namespace godot
{

class Base : public Node
{
  GODOT_CLASS(Base, Node)

private:
  String text;

public:
  static void _register_methods();

  Base();
  ~Base();

  void _init(); // our initializer called by Godot

  void _process(float delta);
};

} // namespace godot

#endif