#ifndef BASE_H
#define BASE_H

#include "core/reference.h"
#include "core/print_string.h"

class Base : public Reference
{
	GDCLASS(Base, Reference);

protected:
	static void _bind_methods();

public:
	void print();

	Base();
};

#endif