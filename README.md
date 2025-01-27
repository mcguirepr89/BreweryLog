## Huge thanks to Sean Morley [(@seanmorley15)](https://github.com/seanmorley15) for creating such a well-made project 🍺

This is a fork of [Sean Morley's](https://seanmorley.com/) [AdventureLog](https://github.com/seanmorley15/AdventureLog/) that is dedicated to tracking visits to breweries. And, yes, I already know about Untappd and agree it's already perfectly suited for this task :smile: -- I just wanted to tinker 🍻

# How to set this up
- Clone the repo:
  ```
  git clone https://github.com/mcguirepr89/BreweryLog.git
  ```
- Change to the BreweryLog directory:
  ```
  cd BreweryLog
  ```
- Edit `docker-compose.yml` to configure your installation. See the original [AdventureLog documentation](https://adventurelog.app/docs/install/docker.html) regarding configuration parameters.
- Then build everything:
  ```
  docker compose build -d && docker logs -f brewerylog-backend
  ```
## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.

## Acknowledgements

- AdventureLog Logo Design by [nordtechtiger](https://github.com/nordtechtiger)
- WorldTravel Dataset [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)
- BreweryLog Emoji by [Laura Humpfer](https://openmoji.org/library/#author=Laura%20Humpfer) under the [CC BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/)
- Beer quotes from [this page](https://pos.toasttab.com/blog/on-the-line/beer-quotes-and-captions) by Tessa Zuluaga

### Top Supporters 
- [Veymax](https://x.com/veymax)
- [nebriv](https://github.com/nebriv)
- [Victor Butler](https://x.com/victor_butler)

