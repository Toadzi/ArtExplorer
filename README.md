<h1>Kurzbeschreibung:</h1>
ArtExplorer  verbindet moderne Webtechnologie mit klassischer Kunst. Die Web App nutzt die Met Museum API, um Kunstwerke in einem Instagram-ähnlichen Feed zu präsentieren. Mit Intersection Observer für Infinite Scroll, CSS Custom Properties für Theming und responsivem Design. Eine Hommage an die Kunst, entwickelt mit JavaScript ES6+, Bootstrap, viel Kaffee, noch mehr graue Haare, selbstzweifel und viel Liebe.

<h1>Learnings und Schwierigkeiten:</h1>
Ich hatte Probleme mit Dark Mode CSS-Feintuning, API Rate Limiting der Met Museum API und Bootstrap Modal Scroll-Konflikte auf Mobile Geräten zu lösen. + iOS Safari Viewport-Herausforderungen.

<h1>Benutzte Ressourcen und Prompts:</h1>

<h3>Ressourcen</h3>
<ul>
<li>The Metropolitan Museum of Art Open Access API: https://metmuseum.github.io/</li>
<li>Bootstrap 5: https://getbootstrap.com/</li>
</ul>
<h3>Benutzung von KI</h3>
<p>Ich habe ganz am Anfang ChatGPT folgendes gefragt:</p>
<ul>
<li>Die Karten sollen immer die maximale Höhe des Bildschirms auf dem iPhone/Safari einnehmen</li>
<li>Die Navigation soll Fixed sein und in der obersten Ebene</li>
<li>Infinity scroll funktioniert nicht, es soll nach dem 6 Bild weitere 6 Datensätze nachladen</li>
</ul>
<p>Und habe dann den Code gepostet, aber es kam nur Mist dabei raus.
ChatGPT war bei der Fehlersuche bis zu einem gewissen Grad ganz hilfreich, aber für die Mobile Version für das IPhone war es nicht hilfreich.
Aber ChatGPT hat mich darauf hingewiesen, das Abfragen von Kategorien bei der verwendeten API fehleerhaft ist. Das war echt hilfreich, denn da habe ich mich lange gewunder warum das nicht wirklich funktioniert. Denn bevor ich das durch die KI darauf aufmerksam gemacht worden bin, wurden immer nur ein paar Bilder geladen.</p>
