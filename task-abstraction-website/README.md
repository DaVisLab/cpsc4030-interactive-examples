# Movies for visualization search activities

`movies.json` is an array of exactly 200 real movie titles, ready for a website to load. It includes The Matrix and Spirited Away. No chart or dashboard layout is prescribed.

## Origin and generated values

Source: [Vega datasets — movies.json](https://raw.githubusercontent.com/vega/vega-datasets/main/data/movies.json), retrieved September 24, 2026. Values are from an older dataset snapshot, not current ratings or updated box-office totals. Source values were retained, not individually independently verified.

138 missing runtimes and one missing audience rating (Spirited Away) were generated for teaching. Each record's `synthetic_fields` array identifies precisely which values are fictional; an empty array means none were generated. Generated runtimes are genre-conditioned fictional values, not estimates of actual runtimes. Three were deliberately set below 100 minutes to support the browse activity. Display a brief notice such as “Real movies; some attributes simulated for teaching.”

The sample contains 10 movies from the 1960s, 25 from the 1970s, 50 from the 1980s, 55 from the 1990s, and 60 from the 2000s. It is deliberately balanced for classroom activities rather than statistically representative. Only source records with positive budget and revenue and a known genre were eligible. Seven example titles were deliberately included. Selection and generation use a fixed random seed.

## Fields

| Field | Meaning |
|---|---|
| `id` | Unique stable identifier within this version of the dataset. |
| `title` | Real movie title as named in the source. |
| `release_year` | Year from the source release date, generally the US release; can differ from the original world premiere. Spirited Away is therefore listed as 2002. |
| `decade` | Derived release-year group, e.g. `1990s`. |
| `genre` | Single major genre from the source; not an exhaustive genre list. |
| `creative_type` | Additional source category such as Science Fiction or Fantasy; null means unavailable. |
| `runtime_min` | Runtime in minutes; source value or explicitly flagged synthetic value. |
| `budget_usd` | Source production budget in nominal US dollars. |
| `revenue_usd` | Source worldwide box-office gross in nominal US dollars; not profit. |
| `audience_rating` | Historical IMDb rating on a 0–10 scale, except the explicitly flagged synthetic rating. |
| `sort_title` | Title with leading The, A, or An removed for catalog sorting. |
| `title_initial` | First character of sort_title; places The Matrix under M. |
| `synthetic_fields` | Array of field names containing generated values in this record. |

Dollar amounts are numeric, not strings, and are not inflation-adjusted. Ratings reflect an unspecified historical snapshot. Patterns involving generated runtimes or the generated rating are classroom examples, not factual movie-industry conclusions.

## Suggested tasks

- **Lookup:** You know The Matrix is in the 1990s under M. Check its runtime. Use decade and title_initial to organize the catalog; its source runtime is 136 minutes.
- **Locate:** Find Spirited Away in a budget-versus-revenue display. Its source budget is $19,000,000 and worldwide gross is $274,949,886.
- **Browse:** Within 1980s Comedy, find a movie rated at least 7 with runtime below 100 minutes. There are seven matches in this teaching dataset; the answer list is in metadata.json.
- **Explore:** Investigate relationships and unusual points involving budget, worldwide revenue, runtime, or rating. Let students choose axes, filters, or details to inspect.

`metadata.json` contains provenance, counts, and an instructor answer list. Keep that file out of student-facing task prompts if you want answers hidden.

## Website loading

```js
const movies = await fetch('./movies.json').then(response => response.json());
```

Serve the file alongside the website. Sort by `sort_title` when constructing the alphabetical catalog. No external service or API key is required.
