# @barandis/toml
*TOML implementation for JavaScript*

For the moment, this is a bit of a playground. While I have every intention of producing a perfectly workable TOML implementation, the primary goal for this project is to have a way to use the project I'm *really* working on, the parser combinator library [Kessel](https://github.com/Barandis/kessel).

In fact, I plan to create a tutorial for Kessel that is based on my creation of this library.

The code here is fine for looking over, but it isn't buildable by itself. I run the Kessel library as a local `npm link` on my machine and `package.json` doesn't reference it. Once things are in a closer-to-final state (for Kessel and for this), I will add it to `package.json` and make it buildable.

In the meantime, if you're looking for a way to use TOML in JavaScript, do a [Github search](https://github.com/search?l=JavaScript&q=toml&type=Repositories) and see what's out there.