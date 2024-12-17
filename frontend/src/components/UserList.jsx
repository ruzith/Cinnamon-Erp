import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers } from '../features/users/userSlice';

function UserList() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, isLoading, isError, message } = useSelector((state) => state.users);

  useEffect(() => {
    console.log('Auth user:', user);
    console.log('Stored user:', localStorage.getItem('user'));
    
    if (user && user.token) {
      dispatch(getUsers());
    } else {
      console.log('No user or token found');
    }
  }, [user, dispatch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {message}</div>;
  }

  return (
    <div>
      {users.map((user) => (
        <div key={user._id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}

export default UserList; 