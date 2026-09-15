import { Schema, model, Document, Types, Query } from 'mongoose';

export const ISSUE_TYPES = ['book', 'order', 'review', 'other'] as const;
export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface IIssueReport extends Document {
  reporter: Types.ObjectId;
  type: IssueType;
  targetId?: Types.ObjectId;
  subject: string;
  body: string;
  status: IssueStatus;
  adminNotes?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const issueReportSchema = new Schema<IIssueReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ISSUE_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: { type: String, enum: ISSUE_STATUSES, default: 'open' },
    adminNotes: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

issueReportSchema.pre(/^find/, function (this: Query<unknown, IIssueReport>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const IssueReport = model<IIssueReport>('IssueReport', issueReportSchema);
