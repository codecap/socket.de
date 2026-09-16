---
layout: post-layout
title: You don't need vendor hardware to publish Kubernetes services
date: 2026-09-16
lang: en
image: "/assets/blog/2026/09/you-dont-need-vendor-hardware-to-publish-kubernetes-services.svg"
description: >
  Kubernetes Services of type LoadBalancer need something to handle route
  advertisement on-premises. This is how Cilium, VyOS, and BGP do it without
  vendor hardware.
---

A customer came to me with a half-formed idea. He had been experimenting with Cilium and BGP, it worked somehow, but he couldn't quite explain how it fit into the existing network. He knew where he wanted to go: Kubernetes services reachable from the outside, securely, inside a multi-zone network. The path there was unclear.

That's where I came in.

## The setup

The customer runs a small startup building critical applications. Security is not optional. It's the foundation. The platform is built with multiple security zones, we used VyOS as router/firewall instance with high availability. Zones are isolated. Traffic flows are controlled. That architecture was already in place.

The new requirement: a Kubernetes cluster, running inside one of the isolated zones, with services that need to be reachable from the internet.

The customer had already tried Cilium. He knew it worked for him and his applications. What he didn't know was how to integrate it cleanly into what already existed.

## Listening first

Before drawing anything, I asked him to explain his idea. He sketched it out, chaotic, with pieces that didn't belong, with approaches he had tried before mixed in with what he actually needed. I didn't stop him.

When he was done, I had enough to work with.

Not everything he described was a requirement. Some of it was implementation detail from his experiments. Some of it was preference. Some of it was uncertainty dressed up as specification.

I separated it into two lists.

**Requirements:** what had to work:
- Kubernetes services reachable from the internet
- Cilium
- BGP-based route advertisement
- Security controls at every layer

**Suggestions:** what could work, what we can use, and what we can add later:
- Multiple Ingress controllers for specific services
- WAF placement for stricter enforcement
- Static routes / Dynamic routes

For the suggestions, I didn't discard them. I reserved space for them in the architecture.

## The integration

Cilium speaks BGP. VyOS speaks BGP. The question was how to make them speak to each other cleanly, without opening more than necessary.

The specific requirement: Kubernetes Services of type LoadBalancer. In a standard on-premises setup, this type of service needs something external to handle the IP assignment and route advertisement. The role that cloud providers fill automatically. Cilium's BGP control plane does exactly that, advertising the LoadBalancer IPs to the upstream router. VyOS, in this case.

Four layers of control:

**1. Firewall rules.** Only specific machines are allowed to initiate BGP sessions. Nothing else gets through.

**2. BGP peer filtering by ASN.** VyOS only accepts sessions from the Cilium BGP peers with the correct autonomous system number. Unknown peers are ignored.

**3. Route filtering.** Not every route Cilium advertises is accepted. Only the prefixes that belong to the cluster services pass through. Everything else is dropped.

**4. BGP password.** Sessions are authenticated. No unauthenticated peer can participate.

The result: Cilium advertises service routes to VyOS. VyOS accepts only what it should, from only who it should, over only the paths that are allowed. The cluster's services become reachable. Nothing else changes.

## The moment it clicked

We met twice to review the architecture. The first time, I showed him a partially cleaned-up version of the sketch we had drawn together. It was already much clearer than what we started with. He could see the direction.

The second meeting, I showed him the full picture. His own network was there. The zones he recognized. The routers he knew. And in the middle, the Kubernetes cluster, connected cleanly, with clear access paths and clear security boundaries.

Then we brought the cluster up and deployed a test application. Routes appeared. We could access it from the internet. We removed the application. Routes disappeared. The dynamic behavior worked exactly as designed.

He had come in with a chaotic idea that he wasn't sure was possible. He left with a working architecture and a clear picture of how it fits into what he already built.

## What this actually proves

You don't need a commercial load balancer to publish Kubernetes services. You don't need a separate network appliance to run BGP, and you don't need a cloud provider either. VyOS is free, open source, and production-ready. Cilium is free, open source, and actively maintained. Together they handle what vendors charge significant licensing fees for.

The harder part isn't the technology. It's understanding what the customer actually needs. And building something that fits into what already exists, with room to grow.

The technology was already there. It just needed to be put together.
