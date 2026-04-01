/** SuperAdmin enables AI while Hola storefront embed is still on */
export const HO_MUTEX_ERR_ENABLE_AI =
  'Cannot enable the AI Store Assistant while the HolaOra storefront embed is on. Turn off the Hola embed first (merchant: Settings → HolaOra).'

/** Merchant (or impersonation) enables Hola embed while AI is still on */
export const HO_MUTEX_ERR_ENABLE_HOLA_EMBED =
  'Cannot enable the HolaOra storefront embed while the AI Store Assistant is on. Turn off the AI assistant first (SuperAdmin: this business → Custom features).'

/** Generic: combined update would leave both on */
export const HO_MUTEX_ERR_BOTH_ON =
  'The AI Store Assistant and HolaOra storefront embed cannot both be enabled. Turn one off before turning the other on.'
