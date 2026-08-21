export interface User {
    id?: number;
    fname: string;
    lname: string;
    email: string;
    dob: string;
    gender: string;
    password: string;
    phone?: string;
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
    trash: boolean;
}