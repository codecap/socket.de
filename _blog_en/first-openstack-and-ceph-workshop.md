---
layout: post-layout
title: First OpenStack and Ceph Workshop
date: 2026-07-06
lang: en
image: "/assets/blog/2026/07/first-openstack-and-ceph-workshop-001.png"
description: >
  Running an OpenStack and Ceph workshop for the first time, what I built,
  why everything is open, and what continuous improvement looks like when
  applied to training.
---

Two groups, same content, two runs.

The plan: two groups of four participants each, same workshop content, adapted each time to what the group actually needed. In the first group, one participant couldn't make it. So we ran with two engineers and one team lead.

Before we started I asked what they expected from the week. The answer wasn't completely clear – but the direction was. Some theory is necessary to understand what you're building. But the focus should be on hands-on experience: build it, see how it behaves, break it, fix it. That set the direction for everything that followed.

## Built Like a CI Pipeline

The workshop environment is scripted, reproducible, and can be rebuilt from scratch at any point – the same way a CI pipeline works.

That's not accidental. It comes from years in DevOps where reproducibility isn't optional. Workshop environments pull from external sources I don't control. Package versions change, dependencies shift. A setup that worked last month may not work today.

Next step: automated daily tests that verify the environment builds correctly and produce a report. That's the DevOps approach applied to workshop infrastructure – continuous improvement, not a one-time setup.

## When Things Don't Go as Planned

During this workshop the environment ran into unexpected issues – most likely caused by specific settings on hardware I hadn't worked with before. Not something we planned.

But that's also where something useful happened: instead of stopping, we used it. We looked at what tools were available, how to diagnose the problem, how to recover. The participants saw a real failure get worked through in real time. That's closer to production experience than any scripted exercise.

Some things we broke on purpose. Some things broke on their own. Both are useful.

The difference between a planned and an unplanned problem is not always visible to the participants. What matters is how you handle it.

## Configurable by Design

The workshop ships with a configuration file and scripts. The environment can be adjusted to match a specific use case, a different hardware setup, or a team's existing infrastructure.

A workshop that only runs on one specific setup isn't useful. The goal is that what you build during the week resembles something you could actually run in your own environment.

## Everything is Open

Slides, scripts, configuration – all published. Anyone can use them to build a lab at home or reproduce the workshop setup independently.

- GitHub: [github.com/codecap/openstack-workshop](https://github.com/codecap/openstack-workshop)
- Workshop overview: [infraguide.org](https://infraguide.org)

Most trainers treat their materials as their main asset. I don't see it that way.

My value is not the slides. It is knowing how to navigate the complexity that comes with running OpenStack and Ceph in practice – where the documentation ends and the real problems begin. That knowledge doesn't sit in a file. It sits in experience.

Open source infrastructure is open by nature. It makes no sense to build a closed workshop around it.

## Hands On From Day One

No slide explains what it feels like when a Ceph OSD goes down and you need to bring it back without losing data. You have to do it.

Every part of this workshop is built around doing. We set things up, we break them on purpose, we fix them. By the end, participants have built a working cluster themselves. They know what it looks like when it breaks and what to do about it.

One of the participants typed every command by hand instead of copy-pasting. When I asked why, he said: so it sits in my fingers. That's the right instinct.

## Complex Topics, Made Approachable

OpenStack and Ceph are not simple. Five days won't change that.

What five days can do: give you a working mental model, a lab you built yourself, and a clear picture of where to go from there. The goal is not to make experts. The goal is to remove the first barrier – the one that stops people from starting.

Everything after that is practice.

## How to Improve – A Continuous Process

Like any system worth running in production, a workshop gets better through iteration. Here is what goes into the next version:

**More content than necessary.** Not to use all of it – but to have the choice. A trainer who can pick the right path for each group delivers a better workshop than one who follows a fixed script. Flexibility requires having more options than you need.

**More use cases.** Participants come with different backgrounds and different problems. More use cases mean each group can work on what's actually relevant to them. One participant chooses a storage-heavy scenario, another focuses on networking. Same content, different view.

The goal is the same as in DevOps: ship, observe, improve, repeat.

---

If you're considering a workshop for your team – the materials are open, the environment is reproducible, and the focus is on what your team actually needs to walk away with something useful.

That's the only kind of workshop worth running.
