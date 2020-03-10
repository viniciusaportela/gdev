#include "base.h"

void Base::print() const
{
	print_line("Hello World");
}

void Base::_bind_methods()
{
	ClassDB::bind_method(D_METHOD("print"), &Base::print);
}

Base::Base() {}