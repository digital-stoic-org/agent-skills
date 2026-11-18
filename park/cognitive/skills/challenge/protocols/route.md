# Protocol: route

Read observed signals and dispatch to the right challenge mode — or to `no-op`. Default entry point (`/challenge <description>`). Replaces the old SKILL.md no-subcommand fallback that asked the human to self-diagnose in taxonomy vocabulary.

---

## Execution

0 sub-agent. 0 questions by default (1 max, only if a blocking signal is missing). Output ≤5 lines.

Signals are READ from the description/context, never asked for.

### Signal table

| Signal | Where it's read | Route |
|---|---|---|
| future-tense verb, "I want to / I'm going to / should" | the sentence | forward |
| a file, output, or written plan exists | Glob/Read/conversation | backward *(not a mode — internal branch to the enjeu-specific mode: anchor \| verify \| framing \| deep, as opposed to forward)* |
| doubt on numbers, dates, quotes, APIs | lexicon | verify |
| "is this the right problem / the right question" | lexicon | framing |
| ONE option described, no argued rejection of alternatives | description structure | anchor |
| "I'm sure that", "obviously", "just need to" | lexicon | anchor (INVERTED SIGNAL) |
| irreversible / public / costly / touches multiple skills | stakes | deep |
| "something feels off but I can't place it" | lexicon | deep |
| reversible, one file, ~10 min of work | stakes | no-op |

### INVERTED SIGNAL rule

Displayed confidence is a trigger, not an exemption. "It's obvious" routes to `anchor`, NEVER to `no-op`. This is the one place the router deliberately contradicts the human's stated confidence — otherwise the router itself would be anchored by enthusiasm, the exact bias it's meant to catch.

### `no-op` as legitimate output

`no-op` is a legitimate verdict, never an invocable mode. A router that always recommends challenge is a salesperson. On a reversible pebble, the cost of 5 questions exceeds the cost of being wrong.

### Composed routes

The router returns a SEQUENCE, not a single mode:

```yaml
routes_composees:
  intention_neuve_engageante: [forward, "-> build ->", deep]
  artefact_existant_doute_net: [famille_unique]
  artefact_existant_doute_diffus: [deep, "-> si verdict Needs revision ->", forward]
  pebble: [no-op]
```

---

## Output

≤5 lines, this exact shape:

```
Route : <mode(s)>
Pourquoi : <detected signals, named explicitly>
Cout : <n turns, sub-agent yes/no>
Angle mort : <what this route will NOT see>
-> « go » · <alternative> · « rien, je fonce »
```

---

## Delivery

If the resolved route walks a queue (`forward`, `anchor`, `verify`, `framing`, `deep`), delivery follows `reference.md` §Interactive Delivery — one question per turn, queue built per `reference.md` §Queue Schema. `route` itself never emits a queue; it only names which protocol should.
