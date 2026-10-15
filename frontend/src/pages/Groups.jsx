import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export default function Groups() {
    const { groupId } = useParams();
    return <Navigate to={groupId ? `/chats/group/${groupId}` : "/chats"} replace />;
}
