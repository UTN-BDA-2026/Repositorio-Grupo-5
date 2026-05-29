import { Schema, model, InferSchemaType } from "mongoose";

const AddressSchema = new Schema(
  {
    label: { type: String, required: true },      // "Casa", "Trabajo"
    street: { type: String, required: true },
    number: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String },
    zip: { type: String },
    country: { type: String, default: "Argentina" },
  },
  { _id: true, timestamps: false }
);

const PreferencesSchema = new Schema(
  {
    newsletter: { type: Boolean, default: false },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    language: { type: String, default: "es" },
    favoriteCategories: { type: [Number], default: [] }, // ids de Category (Postgres)
  },
  { _id: false }
);

const UserProfileSchema = new Schema(
  {
    // userId = id del User en Postgres (Prisma). Lo guardamos como Number.
    userId: { type: Number, required: true, unique: true, index: true },

    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    avatarUrl: { type: String },

    addresses: { type: [AddressSchema], default: [] },
    preferences: { type: PreferencesSchema, default: () => ({}) },

    // Historial agregado (no reemplaza Orders en Postgres, es un cache liviano para perfil)
    viewedProducts: { type: [Number], default: [] }, // ids de Product
  },
  { timestamps: true, collection: "user_profiles" }
);

export type UserProfileDoc = InferSchemaType<typeof UserProfileSchema>;
export const UserProfile = model("UserProfile", UserProfileSchema);
