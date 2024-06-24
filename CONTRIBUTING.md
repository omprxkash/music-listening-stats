# Adding your favourites

This whole site runs off plain JSON, so contributing is mostly editing a file — no build tools or database knowledge needed.

## Add an album you love

Open [`data/favorite-albums.json`](data/favorite-albums.json) and add an entry to the `albums` array:

```json
{
  "rank": 5,
  "title": "Album name",
  "artist": "Artist name",
  "year": 2021,
  "why": "One honest line about why it matters to you.",
  "appleMusic": "https://music.apple.com/...",
  "spotify": "https://open.spotify.com/album/...",
  "cover": ""
}
```

Only `title` and `artist` are required. Leave any link blank (`""`) if you don't have it — the page just hides that button.

## Add a song, playlist, or profile

Same idea, different file:

- Songs → [`data/favorite-songs.json`](data/favorite-songs.json)
- Playlist links → [`data/apple-music.json`](data/apple-music.json)
- Profile links (Apple Music, Spotify, Album of the Year, RateYourMusic, Last.fm) → [`data/profiles.json`](data/profiles.json)

To grab a link, open the album/playlist/profile in the app or on the website, hit **Share → Copy Link** (or just copy the address bar), and paste it in.

## Send it back

1. **Fork** this repository.
2. Edit the file(s) above on a new branch.
3. Open a **pull request** — a title like *"Add my favourites"* is perfect.

That's it. If you're just making your own copy rather than contributing here, skip the pull request and push to your own fork.

## A couple of niceties

- Keep the JSON valid — a trailing comma will break the page. If you're unsure, run `npm test` or paste the file into any JSON validator.
- Be kind in the `why` lines. This is a place for enthusiasm.
