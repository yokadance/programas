export const SHOKLOGIC_URL = "https://api.shocklogic.com/v1.0";
export const API_ABU2025 = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ABU2025}`;
//CONSUME SHK_ID_ABU2025 FROM .ENV

//ABU PROGRAMA:
export const ABU_PROGRAMME = `${API_ABU2025}/Programme/1/0/`;
export const ABU_FACULTY = `${API_ABU2025}/Faculty/`;
//VIALIDAD
export const VIALIDAD_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_VIALIDAD025}/Programme/1/0/`;
export const VIALIDAD_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_VIALIDAD025}/Faculty/`;
//NEURO
export const NEURO_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_NEURO2025}/Programme/1/0/`;
export const NEURO_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_NEURO2025}/Faculty/`;
//ICP
export const ICP_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ICP2025}/Programme/1/0/`;
export const ICP_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ICP2025}/Faculty/`;

//CLATPU2026
export const CLATPU2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_CLATPU2026}/Programme/1/0/`;
export const CLATPU2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_CLATPU2026}/Faculty/`;
//CC2026
export const CC2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_CC2026}/Programme/1/0/`;
export const CC2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_CC2026}/Faculty/`;
export const CC2026_DISERTANTS = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_CCD2026}/Programme/1/0`;

//NEUMO2026
export const NEUMO2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_NEUMO2026}/Programme/1/0/`;
export const NEUMO2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_NEUMO2026}/Faculty/`;

//ALAG2026
export const ALAG2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ALAG2026}/Programme/1/0/`;
export const ALAG2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ALAG2026}/Faculty/`;
export const ALAG2026_SESSION = (sessionId: string) => `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ALAG2026}/Sessions/${sessionId}`;

//GASTRO2026
export const GASTRO2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GASTRO2026}/Programme/1/0/`;
export const GASTRO2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GASTRO2026}/Faculty/`;
export const GASTRO2026_SESSION = (sessionId: string) => `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GASTRO2026}/Sessions/${sessionId}`;

//GINE2026
export const GINE2026_PROGRAMME = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GINE2026}/Programme/1/0/`;
export const GINE2026_FACULTY = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GINE2026}/Faculty/`;
export const GINE2026_SESSION = (sessionId: string) => `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_GINE2026}/Sessions/${sessionId}`;