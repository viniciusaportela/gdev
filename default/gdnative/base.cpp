#include "base.h"

using namespace godot;

void Base::_register_methods()
{
  register_method("_process", &Base::_process);
}

Base::Base()
{
  // constructor
}

Base::~Base()
{
  // add your cleanup here
}

void Base::_init()
{
  // initialize any variables here
  text = "hello world";
}

void Base::_process(float delta) {}