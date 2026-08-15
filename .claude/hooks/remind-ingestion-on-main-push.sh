#!/usr/bin/env bash
# PostToolUse hook (Bash matcher) : declenche un rappel quand une commande
# `git push` ciblant `main` vient de s'executer, pour ne pas oublier de
# relancer l'ingestion contre Railway si les donnees source (dataset
# equipements.sports.gouv.fr, OSM cafes) ont change durant la session.
# Un hook ne peut pas savoir si les donnees ont reellement change : ce
# rappel se contente de resurfacer la question au bon moment, la decision
# de lancer l'ingestion reste un jugement humain/modele informe du contexte.
#
# Utilise `node` plutot que `jq` (non installe sur ce poste) pour parser le
# JSON recu sur stdin - node est deja une dependance du projet.

node -e '
let input = "";
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  let command = "";
  try {
    command = JSON.parse(input).tool_input?.command ?? "";
  } catch {
    process.exit(0);
  }

  if (!/git push/.test(command) || !/\bmain\b/.test(command)) {
    process.exit(0);
  }

  const message =
    "Rappel : cette session a pousse sur main. Si les donnees source " +
    "(dataset equipements.sports.gouv.fr pour les boulodromes, ou " +
    "OpenStreetMap pour les cafes/bars) ont change pendant ce travail, " +
    "relance l ingestion contre la base Railway avant de considerer le " +
    "deploiement termine : railway run npx tsx src/ingestion/run.ts " +
    "(boulodromes) et/ou railway run npx tsx src/ingestion/runCafes.ts (cafes).";

  console.log(JSON.stringify({
    systemMessage: message,
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: message,
    },
  }));
});
'
