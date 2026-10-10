---
title: "On the Name Eidos"
date: 2026-10-10
excerpt: "Eidos is Plato's word for Form, though the architecture it names owes nearly as much to Aristotle, who used the same word, and its craftsman is the one the Gnostics described."
tagline: "Plato's word for Form, though the architecture owes nearly as much to Aristotle."
category: software
tags: ["philosophy", "architecture", "ai"]
---

In [an earlier essay](/eidos-an-architecture-for-cheap-code) I named an architecture Eidos and gave the name one paragraph. This is the longer account. The architecture holds that a system is made of two kinds of material: Forms, which are the interfaces, invariants and hidden decisions a person designs, and implementations, which agents write cheaply and may write again. An implementation is correct insofar as it conforms to its Form, and a machine checks that it does.

Eidos is Plato's word for Form, though the arrangement it names owes nearly as much to Aristotle, who used the same word. Plato's Forms in the *Timaeus* are uncreated: the demiurge builds the world by looking to Forms that already exist and copying them as faithfully as the material allows, and nobody designs them. A designed Form has a better precedent in the tenth book of the *Republic*, where Socrates distinguishes three beds: the Form of the bed, which he says a god made; the bed the carpenter builds by looking to it; and the painter's picture of the carpenter's bed, a copy of a copy, at the third remove from the truth. The mapping is close, if more flattering to the engineer than the engineer deserves. The person who designs the interface stands where Plato put the god, the agent is the carpenter, and the painter is every prose description of code written after the fact. The earlier essay's example was a rule about money that lived in a CONTRIBUTING.md the agent was never shown, and this is why it failed: it was a painting of the rule, and not the rule.

Aristotle supplies the rest. For him, the form of a made thing exists in the soul of the craftsman before it exists in the material, and a house is the builder's form realized in stone. The architecture in the senior engineer's head, which the earlier essay called close to the worst possible input one can hand a coding agent, is exactly Aristotle's form in the soul; what Eidos does is move it out of the soul and into the repository, beside the material it shapes, where a machine can measure the material against it.

Plato never thought the craftsman's copies perfect, since the material resists, but it was the Gnostics, centuries later, who concluded that the craftsman himself could not be trusted, and their account of why is the one that fits. In the Valentinian telling, the demiurge does not know that the higher realm exists; he copies what he has never seen, and is confident in his copies anyway. That is the agent in the example, never shown the rule and passing every test it was given. The craftsman is capable, tireless, and now cheap, and Eidos does not refuse him. It writes the Forms down where he can read them and cannot rewrite them, and it measures every copy he makes against them.

*This is a companion to [Eidos: An Architecture for Cheap Code](/eidos-an-architecture-for-cheap-code). The specification [is here](/eidos).*
