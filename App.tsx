import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import './global.css';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center p-6">
      {/* Card Container */}
      <View className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Avatar Placeholder */}
        <View className="mx-auto mb-4 h-20 w-20 items-center justify-center rounded-full bg-indigo-500">
          <Text className="text-2xl font-bold text-white">IV</Text>
        </View>

        {/* Text Content */}
        <Text className="text-center text-2xl font-bold text-slate-800">Igor Vinson</Text>
        <Text className="mt-2 text-center text-slate-500">
          React Native Developer exploring the power of NativeWind!
        </Text>

        {/* Action Button */}
        <TouchableOpacity className="mt-6 rounded-xl bg-indigo-600 py-4 active:bg-indigo-700">
          <Text className="text-center font-semibold text-white">Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
