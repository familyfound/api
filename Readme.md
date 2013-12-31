
# Here's the API (websockets)

## fetchTree, personId, generations
Indicated to the server that this person is needed

## rebase, personId, generations
cancel all current fetches; they're not important

# first time

start and the base, get /person-with-relationships

1 get root person's relationships
2 fire a "got person"
3 async goto 1 w/ father, mother
4 get root person's sources?

# Things I'm interested in

## starred
In my DB, storing infos about each person
- am starred?
- am marked done? (indep of individual todos)
- notes
- custom todos
  - title
  - created on
  - completed on
  - is hard
- auto todos
  - type (title & category will be look'd up)
  - created on
  - completed on
  - is hard
  - retired on (b/c it looks like it's no longer needed)
- let's denormalize whether or not there are duplicates. I'm ok w/ doing that.
  I think at some point we should refresh that (maybe whne they bring up the
  person card) but in general, we only need to check once.

!! So, if we retire a TODO, because it looks like it's taken care of, and then
the problem later crops back up again, we can alert the user (if it had been
manually marked as done. Otherwise, we just show it normally again)..

## Auto Todo Item Types

### Information
- resolve duplicates
- find birth date / place
- find death date / place
### sources
- find sources
### relationships
- child to more than one spouse
- fix multiple parents
- find children
- find mother
- find father
- verify number of children (seems like too many)
- (?) find spouse for this child - meaning a child w/ only one parent
### temple
- reserve temple ordinances
- get the information required to reserve his temple ordinances
### more
- (?) add a photo or a story about this person

## Extra API Calls

- check duplicates
- get sources
- (?) get temple status
- (?) get photos/stories

## DB More

- list of recently modified people
- list of history actions
  - todo completed/attempted(if they mark it herd) (show text of todo)
  - todo added
  - note added
  - person starred
Schema
- name
- date
- person id
- person name & lifespan

# fan colors

- country of birth
- country of death?
- number of children
- birth year
- status (done, starred, hard)
- # custom todo items
- number of sources

## things that would require more data loading

- has possible duplicates?
- needs sources?

## things that would require even more than I currently do

- comparison of parent to child ages, spouse to spouse
- spouses
  - died before spouse was MIN_MARRIAGE_AGE
- children
  - born before parent was MIN_PARENT_AGE
  - born when parent was over MAX_PARENT_AGE
  - born after parent died
- information about date of marriage, relative to child & parent ages, etc.

