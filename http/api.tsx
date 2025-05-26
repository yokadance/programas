export const SHOKLOGIC_URL = "https://api.shocklogic.com/v1.0";
export const API_ABU2025 = `${SHOKLOGIC_URL}/${process.env.NEXT_PUBLIC_SHK_ID_ABU2025}`;
//CONSUME SHK_ID_ABU2025 FROM .ENV

//ABU PROGRAMA:
export const ABU_PROGRAMME = `${API_ABU2025}/Programme/1/0/`;
    