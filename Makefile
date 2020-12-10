sources := $(wildcard *.base.html)
outputs := $(patsubst %.base.html,%.html,$(sources))

all: $(outputs)

%.html: %.base.html
	node_modules/.bin/edify highlight --select '.language-javascript' --language javascript --trim --dedent < $< > $@
