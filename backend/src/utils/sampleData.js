import { ResearchProject } from '../models/ResearchProject.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';

export const SAMPLE_DOCUMENTS = [
  {
    title: '[Sample] The Melatonin Timing Study: Precision Circadian Entrainment in Night-Shift Personnel',
    originalFilename: 'melatonin_circadian_study_2025.pdf',
    fileType: 'pdf',
    fileSize: 184500,
    pageCount: 3,
    keyThemes: ['Circadian Rhythms', 'Exogenous Melatonin', 'Cognitive Vigilance', 'Shift Work'],
    summary: 'A randomized controlled trial (N=240) evaluating the efficacy of low-dose exogenous melatonin on cognitive vigilance in night-shift clinical staff.',
    pages: [
      {
        pageNumber: 1,
        text: 'Abstract & Introduction: Night-shift medical staff suffer from acute cognitive degradation and circadian misalignment. This randomized controlled trial (N=240) investigated whether low-dose (0.5mg) exogenous melatonin administered 3 hours prior to the targeted daytime sleep window significantly mitigates vigilance decay. Prior investigations utilized supraphysiological doses (3mg - 5mg) that induced residual daytime somnolence. Our baseline hypothesis is that micro-dosing entrains phase-delay mechanisms without impairing wakefulness.'
      },
      {
        pageNumber: 2,
        text: 'Methodology & Findings: Participants completed the standard 10-minute Psychomotor Vigilance Task (PVT) at 02:00 and 06:00 during their shift rotations. Subjects receiving 0.5mg melatonin exhibited a 34% reduction in attention lapses (p < 0.01) compared to the placebo control group. Subjective sleep quality increased by 28%. However, secondary analysis revealed that increasing the dose to 3.0mg resulted in sustained psychomotor grogginess in 12% of participants, impairing early-shift calculation speed.'
      },
      {
        pageNumber: 3,
        text: 'Discussion & Conclusion: Precision chronotherapy using micro-dose melatonin provides robust neurocognitive protection for inverted sleep schedules. The therapeutic window is narrow; exceeding 1.0mg produces carry-over sedation that negates cognitive gains. We conclude that pharmacological circadian intervention alone is sufficient to protect vigilance when administered at the precise biological phase window.'
      }
    ]
  },
  {
    title: '[Sample] Photobiomodulation & High-Intensity Morning Lux Exposure on Neurocognitive Fatigue',
    originalFilename: 'morning_lux_phototherapy_2025.pdf',
    fileType: 'pdf',
    fileSize: 162000,
    pageCount: 2,
    keyThemes: ['Phototherapy', 'Circadian Biology', 'Sustained Attention', 'Non-Pharmacological'],
    summary: 'Evaluation of 10,000 lux blue-enriched phototherapy in 48 shift workers, arguing that non-pharmacological light therapy is superior to oral chronobiotics.',
    pages: [
      {
        pageNumber: 1,
        text: 'Abstract & Background: Non-pharmacological circadian entrainment offers significant advantages over oral chronobiotics. In this controlled intervention (N=48), subjects were exposed to 10,000 lux blue-enriched light (460nm wavelength peak) for 45 minutes immediately upon terminating sleep. We monitored salivary cortisol and sustained attention via the Digit Symbol Substitution Test (DSST).'
      },
      {
        pageNumber: 2,
        text: 'Results & Disagreement: Morning lux exposure yielded a 41% increase in sustained attention and immediate suppression of subjective sleepiness. In direct contrast to pharmacological melatonin regimens, phototherapy caused zero residual daytime somnolence and zero biochemical carry-over effects. However, phototherapy showed no statistically significant effect on total sleep duration (p = 0.42), indicating that light acts purely as an alerting trigger rather than a sleep architectural stabilizer.'
      }
    ]
  },
  {
    title: '[Sample] Dual-Intervention Protocol: Multimodal Chronotherapy & Ambient Behavioral Control',
    originalFilename: 'multimodal_chronotherapy_2026.pdf',
    fileType: 'pdf',
    fileSize: 215000,
    pageCount: 2,
    keyThemes: ['Multimodal Intervention', 'Ambient Control', 'Diagnostic Error Reduction', 'Sleep Architecture'],
    summary: 'A multicenter cohort study demonstrating that pharmacological and photic interventions fail without strict ambient behavioral dark-room adherence.',
    pages: [
      {
        pageNumber: 1,
        text: 'Executive Summary & Hypothesis: Previous mono-therapies (relying exclusively on melatonin or exclusively on lux lamps) report divergent and fragile efficacy profiles. We examined a dual-intervention protocol combining 0.5mg melatonin with 10,000 lux phototherapy and strict dark-room acoustic isolation across 180 emergency medicine physicians.'
      },
      {
        pageNumber: 2,
        text: 'Contradiction Analysis & Synthesis: Our data directly disputes the assertion by the Melatonin Timing Study that pharmacological intervention alone is sufficient. In our cohort, melatonin recipients without strict ambient light blocking (<5 lux during daytime rest) lost 82% of cognitive gains. The dual-intervention group demonstrated a 45% reduction in simulated diagnostic error rates. We conclude that single-modality interventions are clinically unreliable in uncontrolled environments.'
      }
    ]
  }
];

export const seedSampleWorkspace = async (userId) => {
  // Check if sample project already exists
  let project = await ResearchProject.findOne({
    userId,
    title: 'Circadian Biology & Cognitive Performance Research'
  });

  if (!project) {
    project = await ResearchProject.create({
      userId,
      title: 'Circadian Biology & Cognitive Performance Research',
      description: 'Comprehensive demonstration workspace comparing circadian entrainment protocols, pharmacological micro-dosing, and non-pharmacological phototherapy in high-stress work cohorts.',
      tags: ['Circadian Biology', 'Cognitive Science', 'Pharmacology vs Phototherapy', 'Demo Workspace'],
      documentCount: SAMPLE_DOCUMENTS.length
    });
  }

  // Check if documents are already seeded
  const existingDocs = await Document.find({ userId, projectId: project._id });
  if (existingDocs.length >= SAMPLE_DOCUMENTS.length) {
    return { project, documents: existingDocs };
  }

  const createdDocs = [];

  for (const sample of SAMPLE_DOCUMENTS) {
    const existing = await Document.findOne({
      userId,
      projectId: project._id,
      title: sample.title
    });

    if (existing) {
      createdDocs.push(existing);
      continue;
    }

    const fullText = sample.pages.map(p => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');

    const doc = await Document.create({
      userId,
      projectId: project._id,
      title: sample.title,
      originalFilename: sample.originalFilename,
      fileType: sample.fileType,
      fileSize: sample.fileSize,
      processingStatus: 'completed',
      pageCount: sample.pageCount,
      pageMetadata: sample.pages.map(p => ({ pageNumber: p.pageNumber, charCount: p.text.length })),
      summary: sample.summary,
      keyThemes: sample.keyThemes,
      textPreview: fullText.slice(0, 5000),
      chunkCount: sample.pages.length
    });

    // Create chunks
    for (let i = 0; i < sample.pages.length; i++) {
      const page = sample.pages[i];
      await DocumentChunk.create({
        userId,
        documentId: doc._id,
        projectId: project._id,
        chunkIndex: i,
        pageNumber: page.pageNumber,
        text: page.text,
        tokenCount: Math.ceil(page.text.length / 4),
        keywords: sample.keyThemes
      });
    }

    createdDocs.push(doc);
  }

  await ResearchProject.findByIdAndUpdate(project._id, {
    documentCount: createdDocs.length
  });

  return { project, documents: createdDocs };
};

