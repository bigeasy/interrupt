sources := $(wildcard html/*.html)
outputs := $(patsubst html/%.html,%.html,$(sources))

all: $(outputs)

%.html: html/%.html
	node_modules/.bin/edify highlight --select '.language-javascript' --language javascript --trim --dedent < $< > $@
