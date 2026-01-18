import React from 'react';
import { Person, Gender } from '@/types';

export const INITIAL_PEOPLE: Person[] = [
  {
    "id": "1",
    "firstName": "Shadman",
    "lastName": "Sakib",
    "gender": "Male",
    "birthDate": "1945-05-12",
    "bio": "The patriarch of the family. A master woodworker who built the family estate with his own hands.",
    "placeOfBirth": "London, UK",
    "occupation": "Carpenter",
    "photoUrl": "https://picsum.photos/seed/thomas/200/200"
  },
  {
    "id": "2",
    "firstName": "Eleanor",
    "lastName": "Heritage",
    "maidenName": "Smith",
    "gender": "Female",
    "birthDate": "1948-08-21",
    "bio": "Matriarch and historian. She kept the family records meticulously for over 50 years.",
    "placeOfBirth": "York, UK",
    "spouseId": "1",
    "photoUrl": "https://picsum.photos/seed/eleanor/200/200"
  },
  {
    "id": "3",
    "firstName": "James",
    "lastName": "Heritage",
    "gender": "Male",
    "birthDate": "1972-11-03",
    "fatherId": "1",
    "motherId": "2",
    "bio": "Followed in Thomas footsteps but moved into architecture.",
    "placeOfBirth": "London, UK",
    "occupation": "Architect",
    "photoUrl": "https://picsum.photos/seed/james/200/200"
  },
  {
    "id": "4",
    "firstName": "Sarah",
    "lastName": "Grant",
    "maidenName": "Heritage",
    "gender": "Female",
    "birthDate": "1975-02-15",
    "fatherId": "1",
    "motherId": "2",
    "bio": "A passionate gardener and botanist.",
    "placeOfBirth": "London, UK",
    "photoUrl": "https://picsum.photos/seed/sarah/200/200"
  },
  {
    "id": "5",
    "firstName": "Alice",
    "lastName": "Heritage",
    "gender": "Female",
    "birthDate": "2005-06-30",
    "fatherId": "3",
    "bio": "The youngest generation, currently studying history.",
    "photoUrl": "https://picsum.photos/seed/alice/200/200"
  }
];

export const COLORS = {
  male: 'border-blue-500 bg-blue-50',
  female: 'border-rose-500 bg-rose-50',
  other: 'border-slate-500 bg-slate-50',
  maleAccent: 'text-blue-600',
  femaleAccent: 'text-rose-600',
  otherAccent: 'text-slate-600'
};