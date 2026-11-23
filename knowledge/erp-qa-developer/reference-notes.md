# ERP QA Developer reference notes

## Confusable pairs found in the evaluation
- Module: generic access/environment tickets carry a business module their text never mentions (23 of 32 errors).
- Issue area: report requests read as Functional (should be Technical); IB and performance tickets drift to
  Technical/Functional (should be Administration).
- Source: docs/erp-qa-review.md, nlp/results.md

## Language-feature checks
- spaCy errors to watch: capitalised field words as PERSON ("Workgroup", "Calendar"), business-unit codes as GPE
  ("TR", "PO"), PeopleSoft objects as ORG without the EntityRuler.
- VADER domain errors: "pay" negative, "security"/"save" positive.
- Source: reports/nlp-language-evaluation.md

## Test scenarios
- Write Given / When / Then with fictional data, the module's navigation path, and a regression check on the
  neighbouring process.
- Source: https://martinfowler.com/bliki/GivenWhenThen.html

## Official references for the checks above
- spaCy entity labels and NER behaviour: https://spacy.io/usage/linguistic-features
- spaCy EntityRuler (rule entities before the NER): https://spacy.io/api/entityruler
- NLTK VADER sentiment: https://www.nltk.org/howto/sentiment.html
