"use client";
import MyChat from "@/components/MyChat";
import LoadingScreen from "@/components/LoadingScreen";
import { useClerk } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import {User} from "stream-chat";

type HomeState = {
  apiKey: string;
  user: User;
  token: string;
}

export default function Home() {
  const [homeState , setHomeState] = useState<HomeState | undefined>();
const {user: clerkUser} = useClerk()

  const registerUser = useCallback(async function registerUser() {
    const userId = clerkUser?.id;
    const mail = clerkUser?.primaryEmailAddress?.emailAddress;
    if (userId && mail){
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          "Content-Type" : 'application/json',
        },
        body: JSON.stringify({userId: userId, email: mail}),
      });
      const responseBody = response.json();
      return responseBody;
    }
},[clerkUser]);
async function getUserToken(userId: string, userName: string){
const response = await fetch('/api/token', {
  method: "POST",
  headers: {'Content-Type' : 'application/json'},
  body: JSON.stringify({userId: userId}),
});
const responseBody = await response.json();
const token = responseBody.token;
if(!token){
  console.error('No Token found');
}
const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?id=${userId}&name=${userName}`
};
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
if (apiKey){
setHomeState ({apiKey: apiKey , user:user , token: token});
}
}
useEffect(() => {
  if (
    clerkUser?.id &&
    clerkUser?.primaryEmailAddress?.emailAddress &&
    !clerkUser?.publicMetadata.streamRegistered
  ){
    registerUser().then(() => {
getUserToken(
  clerkUser.id,
  clerkUser?.primaryEmailAddress?.emailAddress || 'Unkown'
);
    });
  } else {
    if (clerkUser?.id){
      // Ensure the user is in the default BB server (idempotent — safe for existing members)
      fetch('/api/rejoin-default-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clerkUser.id }),
      }).catch((err) => console.error('[page] rejoin-default-server error:', err));

      getUserToken(
        clerkUser?.id || 'Unkown',
        clerkUser?.primaryEmailAddress?.emailAddress || 'Unkown'
      )
    }
  }
},[registerUser , clerkUser]);
  if (!homeState){
    return <LoadingScreen message="Connecting to Discord..." submessage="Fetching user credentials and permissions" />;
  }
  return (
    <MyChat {...homeState}/>
  );
}

