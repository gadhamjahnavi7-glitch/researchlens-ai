import { ResearchReport } from '../models/ResearchReport.js';
import { ResearchProject } from '../models/ResearchProject.js';
import { generateStructuredReport } from '../services/research/reportGeneratorService.js';
import { reportGenerateSchema } from '../validators/researchSchemas.js';
import { logActivity } from '../models/ActivityLog.js';

export const generateReport = async (req, res, next) => {
  try {
    const validated = reportGenerateSchema.parse(req.body);

    const project = await ResearchProject.findOne({
      _id: validated.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Research project not found.'
      });
    }

    const { reportContent, sourceReferences } = await generateStructuredReport({
      userId: req.user._id,
      projectId: project._id,
      researchQuestion: validated.researchQuestion,
      documentIds: validated.documentIds
    });

    const reportTitle = validated.title || `Research Synthesis: ${validated.researchQuestion.slice(0, 60)}`;

    const newReport = await ResearchReport.create({
      userId: req.user._id,
      projectId: project._id,
      title: reportTitle,
      researchQuestion: validated.researchQuestion,
      reportContent,
      sourceReferences,
      status: 'draft'
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      action: 'REPORT_GENERATED',
      title: 'Synthesized Research Report',
      description: `Generated report "${newReport.title}" (${sourceReferences?.length || 0} papers cited).`
    });

    res.status(201).json({
      success: true,
      message: 'Structured research report generated successfully.',
      report: newReport
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const reports = await ResearchReport.find(filter)
      .sort({ updatedAt: -1 })
      .populate('projectId', 'title')
      .lean();

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await ResearchReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('projectId', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Research report not found.'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const { title, reportContent, status } = req.body;

    const updated = await ResearchReport.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $set: {
          ...(title && { title }),
          ...(reportContent && { reportContent }),
          ...(status && { status })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Research report not found.'
      });
    }

    res.json({
      success: true,
      message: 'Report updated.',
      report: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const report = await ResearchReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Research report not found.'
      });
    }

    res.json({
      success: true,
      message: 'Research report deleted.'
    });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const report = await ResearchReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('projectId', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    const { format = 'markdown' } = req.query;

    if (format === 'markdown') {
      const c = report.reportContent;
      let md = `# ${report.title}\n\n`;
      md += `*Project:* ${report.projectId?.title || 'ResearchLens Workspace'}\n`;
      md += `*Date Generated:* ${new Date(report.createdAt).toLocaleDateString()}\n`;
      md += `*Research Question:* **${report.researchQuestion}**\n\n`;
      md += `---\n\n`;
      md += `## Executive Summary\n${c.executiveSummary || 'N/A'}\n\n`;
      md += `## Background and Context\n${c.background || 'N/A'}\n\n`;

      md += `## Major Findings\n`;
      (c.majorFindings || []).forEach((f, i) => {
        md += `### ${i + 1}. ${f.heading}\n${f.content}\n`;
        if (f.supportingSources?.length) {
          md += `*Sources:* ${f.supportingSources.join(', ')}\n\n`;
        }
      });

      md += `## Comparison of Sources\n${c.sourceComparison || 'N/A'}\n\n`;

      md += `## Supporting Evidence\n`;
      (c.supportingEvidence || []).forEach(e => {
        md += `- **Claim:** ${e.claim}\n  - *Source:* ${e.sourceTitle} (Page ${e.pageNumber})\n  - *Excerpt:* "${e.excerpt}"\n\n`;
      });

      if (c.potentialDisagreements?.length) {
        md += `## Potential Disagreements\n`;
        c.potentialDisagreements.forEach(d => {
          md += `### Disagreement: ${d.topic}\n`;
          md += `- **Position A (${d.claimA?.source}, p.${d.claimA?.page}):** ${d.claimA?.text}\n`;
          md += `- **Position B (${d.claimB?.source}, p.${d.claimB?.page}):** ${d.claimB?.text}\n`;
          md += `- **Hypothesized Reason:** ${d.reason}\n\n`;
        });
      }

      md += `## Research Gaps\n`;
      (c.researchGaps || []).forEach(g => { md += `- ${g}\n`; });
      md += `\n## Limitations\n`;
      (c.limitations || []).forEach(l => { md += `- ${l}\n`; });
      md += `\n## Conclusion\n${c.conclusion || 'N/A'}\n\n`;

      md += `## References\n`;
      (report.sourceReferences || []).forEach((s, idx) => {
        md += `[${idx + 1}] *${s.title}* (${s.filename || 'uploaded document'})\n`;
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
      return res.send(md);
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};

