import { Schema, model, Document, Types } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  },
  { timestamps: true },
);

export const Role = model<IRole>('Role', roleSchema);
