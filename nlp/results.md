# NLP results

All numbers are on **synthetic** data (`data/synthetic/`). Training rows use phrasing bank A; the 250 test rows use a different phrasing bank B and were scored **once**, after all choices were made with 5-fold cross-validation on the training set.

Training rows: 1000 · Test rows: 250

**Cross-validation is grouped by sentence template** (`StratifiedGroupKFold`, 32 training templates): each fold is scored on templates it never saw. A first run with plain stratified k-fold scored 1.000 for both issue-area models because folds shared templates, so it could not choose between them. Disclosure: that first run also produced test scores; the procedure was changed because the CV scores were saturated, and the model is chosen by the grouped CV score below, not by the test score.

## Module classifier

| Model | Chosen parameter | 5-fold CV macro F1 (train) | Test accuracy | Test macro F1 |
|---|---|---|---|---|
| Naive Bayes | alpha=0.05 | 0.796 | 0.844 | 0.832 |
| Logistic regression | C=30 | 0.818 | 0.872 | 0.871 |

**Chosen by grouped CV and exported to the app: Logistic regression.**

### Logistic regression on the test set

```
              precision    recall  f1-score   support

          AM      1.000     0.864     0.927        22
          AP      1.000     0.882     0.938        17
          BN      0.818     0.750     0.783        12
          EP      1.000     0.875     0.933         8
          EX      1.000     0.917     0.957        12
          GL      0.609     0.933     0.737        15
          HR      0.857     0.923     0.889        39
          PC      0.750     1.000     0.857         6
          PO      0.789     1.000     0.882        15
          PT      0.833     0.625     0.714         8
          PY      0.857     0.789     0.822        38
          RC      1.000     1.000     1.000         7
         SEC      0.824     0.778     0.800        18
          TL      1.000     0.909     0.952        33

    accuracy                          0.872       250
   macro avg      0.881     0.875     0.871       250
weighted avg      0.887     0.872     0.874       250

```

Confusion matrix (rows = true, columns = predicted):

|  | AM | AP | BN | EP | EX | GL | HR | PC | PO | PT | PY | RC | SEC | TL |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AM** | 19 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **AP** | 0 | 15 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| **BN** | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 |
| **EP** | 0 | 0 | 0 | 7 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **EX** | 0 | 0 | 0 | 0 | 11 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **GL** | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| **HR** | 0 | 0 | 0 | 0 | 0 | 0 | 36 | 0 | 1 | 0 | 0 | 0 | 2 | 0 |
| **PC** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 |
| **PO** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 |
| **PT** | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 5 | 2 | 0 | 0 | 0 |
| **PY** | 0 | 0 | 1 | 0 | 0 | 2 | 3 | 0 | 1 | 0 | 30 | 0 | 1 | 0 |
| **RC** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 |
| **SEC** | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 1 | 0 | 0 | 0 | 14 | 0 |
| **TL** | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 30 |

Misclassified test tickets (32), for review by the ERP QA Developer:

- IN001006 "Terminate user access": true **PY**, predicted **SEC**
- IN001031 "Who has Payroll Inquiry?": true **PY**, predicted **HR**
- IN001046 "Need TST refreshed": true **PT**, predicted **PY**
- IN001121 "Customization broken after PUM update": true **TL**, predicted **PO**
- IN001150 "Project migration request": true **BN**, predicted **PC**
- IN001162 "System very slow": true **EX**, predicted **GL**
- IN001181 "Transfer - update roles": true **SEC**, predicted **HR**
- IN001198 "Terminate user access": true **HR**, predicted **SEC**
- IN001229 "Disable login SYNUSER0711": true **SEC**, predicted **GL**
- IN001258 "Patch CFG": true **PY**, predicted **BN**
- IN001261 "Terminate user access": true **PY**, predicted **HR**
- IN001289 "PS Query for Code Enforcement": true **EP**, predicted **GL**
- IN001336 "Disable login SYNUSER0602": true **PY**, predicted **GL**
- IN001348 "Patch DEV": true **AP**, predicted **BN**
- IN001425 "Add Entitlement option": true **AM**, predicted **HR**
- IN001433 "Patch TST": true **BN**, predicted **PY**
- IN001453 "Patch TRN": true **PY**, predicted **HR**
- IN001650 "Need CFG refreshed": true **TL**, predicted **GL**
- IN001672 "Terminate user access": true **PY**, predicted **GL**
- IN001697 "Patch TRN": true **PY**, predicted **PO**
- IN001773 "Disable login SYNUSER1702": true **SEC**, predicted **HR**
- IN001876 "Terminate user access": true **HR**, predicted **SEC**
- IN001923 "Need TST refreshed": true **GL**, predicted **PY**
- IN001944 "Need DEV refreshed": true **HR**, predicted **PO**
- IN001971 "Need TST refreshed": true **PT**, predicted **PY**
- IN001990 "PS Query for Planning and Zoning": true **AM**, predicted **GL**
- IN002017 "Add Taskgroup option": true **TL**, predicted **PY**
- IN002026 "Patch UAT": true **AP**, predicted **PT**
- IN002037 "Error message when saving Permission Lists": true **SEC**, predicted **PO**
- IN002049 "PS Query for Planning and Zoning": true **PT**, predicted **GL**
- IN002082 "Need TRN refreshed": true **AM**, predicted **GL**
- IN002211 "Project migration request": true **BN**, predicted **PC**

## Issue area classifier

| Model | Chosen parameter | 5-fold CV macro F1 (train) | Test accuracy | Test macro F1 |
|---|---|---|---|---|
| Naive Bayes | alpha=0.05 | 0.757 | 0.912 | 0.918 |
| Logistic regression | C=100 | 0.601 | 0.868 | 0.867 |

**Chosen by grouped CV and exported to the app: Naive Bayes.**

### Naive Bayes on the test set

```
                precision    recall  f1-score   support

Administration      0.970     0.821     0.889        39
    Functional      0.890     0.951     0.919       102
      Security      0.971     1.000     0.985        33
     Technical      0.892     0.868     0.880        76

      accuracy                          0.912       250
     macro avg      0.931     0.910     0.918       250
  weighted avg      0.914     0.912     0.911       250

```

Confusion matrix (rows = true, columns = predicted):

|  | Administration | Functional | Security | Technical |
|---|---|---|---|---|
| **Administration** | 32 | 3 | 0 | 4 |
| **Functional** | 0 | 97 | 1 | 4 |
| **Security** | 0 | 0 | 33 | 0 |
| **Technical** | 1 | 9 | 0 | 66 |

Misclassified test tickets (22), for review by the ERP QA Developer:

- IN001041 "Bulk change of job row records": true **Functional**, predicted **Technical**
- IN001069 "IB errors for Job Data save PeopleCode": true **Administration**, predicted **Technical**
- IN001136 "IB errors for Candidate Gateway": true **Administration**, predicted **Technical**
- IN001162 "System very slow": true **Administration**, predicted **Functional**
- IN001180 "Report request - Job Code by Parks and Recreation": true **Technical**, predicted **Functional**
- IN001248 "Water Utilities - grant issue": true **Functional**, predicted **Technical**
- IN001312 "Bulk change of job row records": true **Functional**, predicted **Technical**
- IN001400 "Report request - Entitlement by Animal Services": true **Technical**, predicted **Functional**
- IN001407 "System very slow": true **Administration**, predicted **Functional**
- IN001424 "Customization broken after PUM update": true **Technical**, predicted **Functional**
- IN001506 "Code change - department security tree": true **Technical**, predicted **Administration**
- IN001555 "Fire Rescue - capital project issue": true **Functional**, predicted **Security**
- IN001562 "Code change - expense approval workflow": true **Technical**, predicted **Functional**
- IN001632 "Code Enforcement - encumbrance issue": true **Functional**, predicted **Technical**
- IN001769 "Report request - Balance by Public Works": true **Technical**, predicted **Functional**
- IN001792 "Outbound file incomplete": true **Technical**, predicted **Functional**
- IN001810 "IB errors for PC_INTFEDIT Application Engine": true **Administration**, predicted **Technical**
- IN001829 "Report request - Benefit Plan by Animal Services": true **Technical**, predicted **Functional**
- IN002014 "System very slow": true **Administration**, predicted **Functional**
- IN002129 "IB errors for GL_JEDIT Application Engine": true **Administration**, predicted **Technical**
- IN002141 "Report request - Tax Location by Water Utilities": true **Technical**, predicted **Functional**
- IN002218 "Report request - federal withholding by Community Services": true **Technical**, predicted **Functional**

## Similar tickets, duplicates and recurring issues

| Measure | Value | How it was measured |
|---|---|---|
| Similar-ticket precision@5 (test) | 0.955 | 22 test tickets whose recurring group has another member in the test file; share of the top-k most similar tickets (k = min(5, group size - 1)) from the same group |
| Duplicate threshold (cosine) | 0.85 | tuned on training pairs (F1 0.428); related threshold 0.65 |
| Duplicate precision / recall (test pairs) | 0.385 / 0.455 | pairs at or above the duplicate threshold vs same recurring group |
| Clustering threshold (cosine similarity) | 0.74 | tuned on training set (ARI 0.975) |
| Recurring-issue clustering ARI (test) | 0.898 | adjusted Rand index vs recurring-group labels, tickets with a group |

## Priority suggestion

Rule-based cues from `docs/ticket-taxonomy.md` agree with the synthetic Priority label on **64.0%** of test tickets. The synthetic labels contain deliberate noise, so 100% is not expected; the app shows disagreements for a person to review rather than overriding PHIRE.

## Summary

| Label | Naive Bayes test accuracy | Logistic regression test accuracy | Exported model (by grouped CV) | Exported test accuracy | Exported macro F1 |
|---|---|---|---|---|---|
| Module | 0.844 | 0.872 | Logistic regression | 0.872 | 0.871 |
| Issue area | 0.912 | 0.868 | Naive Bayes | 0.912 | 0.918 |

## Limitations

- Synthetic, template-generated text is cleaner than real tickets; accuracy on real PHIRE data will be lower.
- TF-IDF ignores word order and misses paraphrases with no shared words; embeddings are a future improvement.
- Module codes, statuses and priority scale beyond those seen in the sample export are assumptions (to confirm).
