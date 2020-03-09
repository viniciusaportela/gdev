#include "base.h"

int Base::printer() const {
	return 200;
}

void Base::_bind_methods() {
	ClassDB::bind_method(D_METHOD("printer"), &Base::printer);
}

Base::Base() {}