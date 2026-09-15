import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  slug: string;
  name: string;
  description?: string;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    section: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true },
);

export const Permission = model<IPermission>('Permission', permissionSchema);
