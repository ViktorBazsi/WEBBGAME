# WEBBGAME - LOG DONE


ELSŐ alap CRUD-ok utáni prompt (ha esetleg elveszne):
módosítsd kérlek, ha törlöm az adott charactert, vagy majd az adott girlfriend karaktert, akkor a hozzájuk tartozó Stat tábla is törlődjön!

az affection az default 75? 50-re kéne módosítnai, ha így caharacterrel együtt adom hozzá. Kéne azonban tudnom csinálni, nem karakter nélküli, ha tetszik singli, alap girlfriendet. Majd azt akarom, hogy a játékos több girlfriend közül választhasson. Ehhez be kéne vezetni az admin role-t. Legyen admin és user role. Az admin mindent tudjon, mindig. 

és itt, az add girlfriend, user role-lal, legyen csak simán a megfelelő girlfriend és character táblák összekötése. Ez csak akkor jöhessen elő, ha legalább 50-es az affection-ja az adott girlfriendnek.

Ahogy most van a girlfriend hozzáadása, az is maradjon meg, de csak admin role-lal. Azt szeretném, hogy egy egyszerű user ne tudjon új girlfriendet kreálni magának. Azt tudja majd megmondani, hogy mit csináljon az adott girlfriend, ami majd módosítja a girlfriend stat-jait.

az activites-be bele kéne írni, hogy a name az legyen unique, ne lehessen két run activity. Fontos lesz majd, hogy a run után run 2 kell, hogy jöjjön, hiszen innen fogjuk tudni, hogy melyik level-t keressük éppen. A level arra szolgál, hogy egy 1-es Run activitjü karakter ne tudjon 5-ös run-t csinálni. Hiszen más a kettő.

csinálj egy olyan endpointot, ahol az adott karakter munkát választhat magának. AddjobForChar vagy valami ilyesmi.

csinálj egy olyan enpointot (ez admin jogosultság legyen, egy egyszerű user ne tudjon tevékenységet hozzáadni) ahol az adott location-hoz hozzá tudom majd adni az általam választott tevékenységet!

Sőt, igazából tevékenységet se tudjon az adott user hozzáadni. Az is maradjon az adminnál.

végigteszteltem, működik minden!
