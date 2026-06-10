## Problème

Le changement de langue dans le profil bascule bien l'i18n côté UI (header, footer, boutons, labels). Mais l'écran reste majoritairement en français parce que **toutes les métadonnées pédagogiques** (titres de niveaux, modules, thèmes, badges, titres et descriptions de leçons) sont en dur dans `src/data/curriculum.ts` — 6 niveaux × 5 modules × 10 leçons = ~330 chaînes FR jamais traduites. Ces chaînes alimentent Catalogue, Parcours, ModuleDrawer, cartes de leçons, recommandations, etc., d'où l'impression que « presque rien ne change ».

## Objectif

Traduire automatiquement les **titres, thèmes, badges, objectifs et descriptions** des niveaux/modules/leçons en EN/ES/DE/IT/RU via Lovable AI Gateway, et brancher le rendu sur i18n. Le contenu pédagogique des exercices (dialogues, QCM, énoncés FR) reste inchangé conformément à la règle projet.

## Plan d'implémentation

### 1. Générer les traductions (script one-shot)

- Créer `scripts/translate-curriculum.mjs` qui :
  - Importe la constante `curriculum` depuis `src/data/curriculum.ts`
  - Construit un payload JSON aplati `{ levels: {...}, modules: {...}, lessons: {...} }` en français
  - Pour chaque langue cible (EN, ES, DE, IT, RU), appelle Lovable AI Gateway (`google/gemini-3-flash-preview`) avec un prompt strict : « Traduis ces chaînes FR en {LANG}, garde le ton pédagogique, conserve les noms propres (Antibes, Juan-les-Pins, Provence), réponds en JSON identique à la structure d'entrée »
  - Batch par niveau (6 appels par langue, 30 au total) pour rester sous les limites de tokens
  - Valide la forme du JSON retourné et fusionne dans un fichier intermédiaire `scripts/output/curriculum.{lang}.json`

- Lance le script localement via `node scripts/translate-curriculum.mjs` (clé `LOVABLE_API_KEY` lue depuis l'env). Coût : ~30 requêtes.

### 2. Intégrer les traductions dans i18n

- Ajouter un namespace `curriculum` dans chaque locale (`fr.json`, `en.json`, etc.) avec la structure :
  ```
  curriculum: {
    levels: { A1: { title, objective }, A2: {...}, ... },
    modules: { "A1.1": { title, theme, badge }, "A1.2": {...}, ... },
    lessons: { "1": { title, description }, "2": {...}, ... 300 }
  }
  ```
- Le `fr.json` est rempli à partir du contenu original de `curriculum.ts` (source de vérité, fallback).
- Les 5 autres locales reçoivent la sortie du script.

### 3. Helper de lecture i18n côté composants

Créer `src/lib/curriculumI18n.ts` :
```ts
export function useCurriculumI18n() {
  const { t } = useTranslation();
  return {
    levelTitle: (lvl) => t(`curriculum.levels.${lvl}.title`),
    levelObjective: (lvl) => t(`curriculum.levels.${lvl}.objective`),
    moduleTitle: (id) => t(`curriculum.modules.${id}.title`),
    moduleTheme: (id) => t(`curriculum.modules.${id}.theme`),
    moduleBadge: (id) => t(`curriculum.modules.${id}.badge`),
    lessonTitle: (n) => t(`curriculum.lessons.${n}.title`),
    lessonDescription: (n) => t(`curriculum.lessons.${n}.description`),
  };
}
```
i18next renvoie automatiquement la valeur FR si la clé manque dans la langue active.

### 4. Brancher les consommateurs

Remplacer les accès directs `module.title`, `module.theme`, `lesson.title`, `lesson.description`, `level.objective` par les helpers dans :

- `src/pages/Catalogue.tsx`
- `src/pages/Curriculum.tsx`
- `src/pages/CourseDetail.tsx`
- `src/components/courses/ModuleDrawer.tsx`
- `src/components/courses/ModuleNode.tsx`
- `src/components/courses/LearningPath.tsx`
- `src/components/courses/CourseCard.tsx`
- `src/components/dashboard/RecommendedCarousel.tsx`
- `src/components/dashboard/ResumeCard.tsx`
- `src/components/dashboard/MiniZigzag.tsx`

La structure `curriculum.ts` n'est pas modifiée — elle reste la source FR + l'ordre/structure du parcours.

### 5. Vérification

- Charger le preview, aller sur `/profil`, changer la langue → vérifier que Catalogue, Parcours, ModuleDrawer affichent les titres traduits.
- Repasser en FR → tout revient à l'original.
- Lancer une leçon : le contenu d'exercices reste en FR (attendu).
- Si une clé manque (ex. une langue qui a échoué partiellement) → fallback FR transparent, pas de `[curriculum.modules.X.title]` cassé visible.

## Détails techniques

- Pas de modification de la table `profiles` ni des hooks d'auth existants (`useInterfaceLanguage` fonctionne déjà bien).
- Pas de migration BDD nécessaire.
- Les badges emoji (`badgeEmoji: '🏖️'`) restent dans `curriculum.ts`, ils sont universels.
- Les codes compétence (`CO + PO`, `PE`, etc.) sont des sigles techniques — on les garde inchangés.
- Le script est versionné mais ne tourne pas en CI ; il se relance manuellement quand `curriculum.ts` change.
- Volume final : ~330 entrées × 5 langues = ~1650 chaînes, ajoute ~150 KB total aux bundles i18n (chargés au démarrage — acceptable, déjà tout-in-one).

## Hors scope

- Traduction du contenu des exercices (QCM, dialogues, flashcards dans `src/data/a1-module*-content.ts`, etc.) — règle projet explicite.
- Traduction des achievements, glossaire, démo-courses (peut être ajouté plus tard si besoin).
- Refonte du système i18n (pas de namespaces séparés, on reste sur le `translation` global existant).
