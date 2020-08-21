# COVIDAPP
Base project for COVIDstoplight and sibling apps

## Purpose
COVIDstoplight is intended to enable community reporting of symptoms that may provide early indications of COVID-19 outbreaks. Specifically, the app 
asks users how they are feeling and offers a list of the CDC recognized COVID symptoms to (optionally) select from. All data are collected anonymously
and reported at a resolution of Zip Code.

Data collected via COVIDstoplight are available via a public API and are incorporated into the [Chicalgoland COVID-19 Commons](chcagoland.pandemicresponsecommons.org) where they are available to consortium members for analysis.

## Origin
COVIDstoplight is an early fork of the [Fevermap](fevermap.net) project that had been developed to enable self-reporting of fever status to 
help track the spread of COVID-19. COVIDstoplight draws its core architecture and much of its look and feel from Fevermap but takes a slightly
different approach, soliciting more general self-reported symptoms rather than relying on fever. It also adopts an Illinois-specific focus given
the target communities.

## Development
COVIDstoplight employs a Docker-based development environment, which is drawn directly from Fevermap.
