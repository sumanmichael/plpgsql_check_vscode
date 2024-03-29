# Change Log

All notable changes to the "plpgsql-checker" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.0-alpha] - 2023-02-24

### Added

- Added pgsql-parser to parse the SQL and PL/pgSQL blocks
- Entire extension uses single persistent client session to the db
- Finer diagnostics at keyword granularity
- Comprehensive Diagnostics with Detail, Hint and Context
- Diagnotics now include sqlstate and statement type

### Removed

- Removed support for **Windows**, due to pgsql-parser. See https://github.com/pganalyze/libpg_query/issues/44, https://github.com/pyramation/pgsql-parser/issues/95#issuecomment-1376730703
- Replaced regex to parse CREATE routine blocks