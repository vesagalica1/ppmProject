import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddEditWorkoutScreen from '../screens/AddEditWorkoutScreen';
import DayWorkoutsScreen from '../screens/DayWorkoutsScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeightTrackerScreen from '../screens/WeightTrackerScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const AddStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="DayWorkouts"
        component={DayWorkoutsScreen}
        options={{ title: 'Workouts' }}
      />
      <HomeStack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{ title: 'Workout' }}
      />
      <HomeStack.Screen
        name="AddEditWorkout"
        component={AddEditWorkoutScreen}
        options={({ route }) => ({ title: route.params?.workout ? 'Edit Workout' : 'Add Workout' })}
      />
      <HomeStack.Screen
        name="WeightTracker"
        component={WeightTrackerScreen}
        options={{ title: 'Weight' }}
      />
    </HomeStack.Navigator>
  );
}

function AddStackNavigator() {
  return (
    <AddStack.Navigator screenOptions={stackScreenOptions}>
      <AddStack.Screen
        name="AddWorkout"
        component={AddEditWorkoutScreen}
        options={{ headerShown: false }}
      />
    </AddStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

const ICONS = {
  HomeTab: 'home',
  AddWorkoutTab: 'add-circle',
  ProfileTab: 'person',
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen
        name="AddWorkoutTab"
        component={AddStackNavigator}
        options={{ title: 'Add' }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Always start the Add tab on a blank form.
            navigation.navigate('AddWorkoutTab', { screen: 'AddWorkout', params: {} });
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
