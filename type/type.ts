export type ProgrammeData = {
  Programme: {
    Days: {
      [date: string]: {
        VisibleSessionCount: number;
        Date_String: string;
        Date_Numeric: number;
        Session_Groups: {
          [groupName: string]: {
            Sessions: Session[];
          };
        };
      };
    };
  };
};

export type Day ={
  Date_String: string;
  Date_Numeric: number;
  VisibleSessionCount: number;
  Session_Groups: SessionGroup[];
}

export type SessionGroup= {
  Sessions: Session[];
}

export type Session ={
  Session_Id: string;
  Session_Title: string;
  Session_Type: string;
  Session_Chair: string | null;
  Session_CoChair: string | null;
  Session_Faculty: Faculty[];
  Session_Type_Id: string | null;
  Type_Of_Session: number;
  Show_Eposters: number;
  Use_For_Feedback: boolean;
  Use_For_Questions: boolean;
  Use_For_Livepolling: boolean;
  Use_For_Virtual_Session: boolean;
  Virtual_Room_Link: string | null;
  Session_Location: string | null;
  Session_Room_Image: string | null;
  Room: Room;
  Session_Hide: number;
  Session_Hide_Presentations: number;
  Session_Is_Poster: number;
  Session_Show_Posters: number;
  Session_HTML: string | null;
  Session_Date: string;
  Session_Start_Time: string;
  Session_End_Time: string;
  Session_Notes: string | null;
  Session_Group: string | null;
  Presentations: Presentation[];
}

export type Faculty = {
  Faculty_Id: string;
  First_Name: string;
  Family_Name: string;
  Full_Name?: string;
  Email?: string;
  Country_Name?: string;
  Biography?: string;
  Prefix_Title?: string;
  Image01?: string;
  [key: string]: any; // Para campos ExtraField y otros dinámicos
}

export type Room = {
  Room_Id: string;
  Room_Name: string;
  Room_Location: string | null;
}

export type Presentation = {
  Presentation_Id: string;
  Presentation_Title: string;
  Start_Time: string;
  Sequence_Number: string;
  AllSpeakersList: string;
  AllSpeakers: Speaker[];
  Abstract: Abstract;
  Abstract_Driven: boolean;
}

export type Speaker = {
  Sequence_No: string;
  Faculty_Id: string;
  First_Name: string;
  Family_Name: string;
  Full_Name: string;
  Country_Name: string;
  Prefix_Title?: string;
  Image01?: string;
  Email?: string;
  Biography?: string;
  Company?: string;
  Job_Title?: string;
}

export type Abstract = {
  Abstract_ID: string;
  AbstractTitle: string;
  AttachmentCount: number;
  Attachments: any[];
  code: string;
  AbstractTopicGroups: any[];
  AbstractTopic: string;
  AbstractTopicCodes: string;
  AbstractStatus: string;
  AbstractSessionTime: string;
  Online_Programme_Is_Viewable: string;
  AbstractAllAuthors: string;
  AbstractSpeakers: string;
  AbstractNonPresentingAuthors: string;
  AbstractAllAffiliations: any[];
  AbstractAllAffiliationsList: string;
  Authors: any[];
  AllAuthorsList: string;
}
