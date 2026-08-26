export interface User {
    id?: number;
    fname: string;
    lname: string;
    email: string;
    dob: string;
    gender: string;
    password: string;
    phone?: string;

    // email change
    emailChangeCount?: number;
    emailChangeYear?: number;
    emailChangeStartedAt?: string | null;
    emailChangeExpiresAt?: string | null;
}

export interface Mail {
    id?: number;
    from: string;
    to: string;
    subject: string;
    body: string;
    date: string;
    read: boolean;
    starred: boolean;
    draft?: boolean;
    spam?: boolean;
    archived?: boolean;
    trash: boolean;
    threadId?: string;
    replyToId?: number;
    attachment?: {
        name: string;
        type: string;
        data: string;
    };

    promotion?: boolean;
    social?: boolean;
    updates?: boolean;
}